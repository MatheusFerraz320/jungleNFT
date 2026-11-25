import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/features/auth';
import { queryKeys } from '@/shared/api/query-keys';
import type { Session, User } from '@/shared/contracts';
import { changePassword, getProfile, updateProfile } from '../api/profile-api';

export function profileQueryOptions(userId: string) {
  return queryOptions({
    queryKey: queryKeys.profile(userId),
    queryFn: ({ signal }) => getProfile(signal),
  });
}

export function useProfile() {
  const user = useCurrentUser();
  return useQuery({ ...profileQueryOptions(user?.id ?? 'anonymous'), enabled: Boolean(user) });
}

/** Salva dados/avatar e propaga o usuário atualizado para a sessão (nome no header, etc.). */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (user: User) => {
      queryClient.setQueryData(queryKeys.profile(user.id), user);
      queryClient.setQueryData<Session | null>(queryKeys.auth.session, (session) =>
        session ? { ...session, user } : session,
      );
    },
  });
}

export function useChangePassword() {
  return useMutation({ mutationFn: changePassword });
}
