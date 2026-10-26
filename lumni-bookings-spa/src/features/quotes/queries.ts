import {
  keepPreviousData,
  queryOptions,
  skipToken,
} from '@tanstack/react-query'
import { httpClient } from '../../api/http-client'
import type { Quote, QuoteRequest } from './quote.types'

async function fetchQuote(request: QuoteRequest): Promise<Quote> {
  const { data } = await httpClient.post<Quote>('/quotes', request)
  return data
}

// The quote depends on the current time and on other customers' bookings, so it is never cached for long.
// Without a request (no start time left that day) the query stays idle.
export function quoteQueryOptions(request: QuoteRequest | undefined) {
  return queryOptions({
    queryKey: ['quotes', request ?? null],
    queryFn: request ? () => fetchQuote(request) : skipToken,
    placeholderData: keepPreviousData,
    retry: false,
  })
}
