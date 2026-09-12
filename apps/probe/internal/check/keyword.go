package check

import (
	"bytes"
	"context"
	"errors"
	"time"
)

var (
	errMissingTarget  = errors.New("missing target")
	errMissingKeyword = errors.New("missing keyword")
	errKeywordMissing = errors.New("keyword not found")
)

func Keyword(ctx context.Context, job Job) Result {
	started := time.Now()
	if job.Keyword == "" {
		result := baseResult(job, started)
		result.Status = StatusDown
		result.Error = strPtr(errMissingKeyword.Error())
		result.LatencyMs = int64Ptr(0)
		return result
	}
	out := fetchHTTP(ctx, job)
	result := interpretHTTP(out, job, started)
	if result.Status != StatusUp {
		return result
	}
	if !bytes.Contains(out.Body, []byte(job.Keyword)) {
		result.Status = StatusDown
		result.Error = strPtr(errKeywordMissing.Error())
		return result
	}
	return result
}
