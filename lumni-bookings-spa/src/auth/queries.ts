import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { fetchMe, login, logout } from './api'

export const meQueryOptions = queryOptions({
  queryKey: ['auth', 'me'],
  queryFn: fetchMe,
  retry: false,
})

export function useLoginMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: login,
    onSuccess: (user) => {
      queryClient.setQueryData(meQueryOptions.queryKey, user)
    },
  })
}

export function useLogoutMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear()
      queryClient.setQueryData(meQueryOptions.queryKey, null)
    },
  })
}
