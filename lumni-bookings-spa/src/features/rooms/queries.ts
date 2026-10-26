import { queryOptions } from '@tanstack/react-query'
import { httpClient } from '../../api/http-client'
import type { Room } from './room.types'

async function fetchRooms(): Promise<Room[]> {
  const { data } = await httpClient.get<Room[]>('/rooms')
  return data
}

export const roomsQueryOptions = queryOptions({
  queryKey: ['rooms'],
  queryFn: fetchRooms,
  staleTime: 5 * 60 * 1000,
})
