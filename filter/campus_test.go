package filter

import (
	"context"
	"testing"

	"github.com/stretchr/testify/require"
)

// Campus lost-and-found fields: item_status and location are stored inside the
// memo payload JSON column and must render to JSON_EXTRACT-based SQL on every
// dialect.
func TestRenderCampusLostFoundFilters(t *testing.T) {
	t.Parallel()

	engine, err := NewEngine(NewSchema())
	require.NoError(t, err)

	for _, dialect := range []DialectName{DialectSQLite, DialectMySQL, DialectPostgres} {
		// item_status equality
		statement, err := engine.CompileToStatement(context.Background(), `item_status == "LOST"`, RenderOptions{Dialect: dialect})
		require.NoError(t, err, dialect)
		require.Contains(t, statement.SQL, "itemStatus", dialect)
		require.Equal(t, []any{"LOST"}, statement.Args, dialect)

		// item_status IN
		statement, err = engine.CompileToStatement(context.Background(), `item_status in ["LOST", "FOUND"]`, RenderOptions{Dialect: dialect})
		require.NoError(t, err, dialect)
		require.Contains(t, statement.SQL, "IN (", dialect)

		// location text match
		statement, err = engine.CompileToStatement(context.Background(), `location.contains("图书馆")`, RenderOptions{Dialect: dialect})
		require.NoError(t, err, dialect)
		require.Contains(t, statement.SQL, "placeholder", dialect)

		// combined with existing fields
		_, err = engine.CompileToStatement(
			context.Background(),
			`item_status == "LOST" && location.contains("图书馆") && created_ts > now - duration("168h")`,
			RenderOptions{Dialect: dialect},
		)
		require.NoError(t, err, dialect)
	}

	// An unknown status value is still valid CEL (the service layer validates
	// the domain), but a type error is rejected at compile time.
	_, err = engine.Compile(context.Background(), `item_status == 1`)
	require.Error(t, err)
}
