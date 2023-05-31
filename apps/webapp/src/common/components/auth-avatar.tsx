import { Avatar } from '@mantine/core';
import { useUser } from '../session';

const AuthAvatar: React.FC = () => {
  const { user } = useUser();
  // const name = user.user_info?.display_name ?? user.email;
  const name = user.info?.display_name ?? 'anonymous';
  const firstLetters = name.slice(0, 2).toUpperCase();
  return (
    <Avatar color="primary" alt={name} radius="xl" size={40}>
      {firstLetters}
    </Avatar>
  );
};

export default AuthAvatar;
