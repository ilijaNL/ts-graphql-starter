import { Box, Button, Group, LoadingOverlay, Stack } from '@mantine/core';
import { redirectOAuth } from '@/common/auth';

import { useSession } from '@/common/session';
import Redirect from '../redirect';
import { routes } from '@/routes';
import { GithubIcon } from '@mantine/ds';

export default function LoginForm() {
  const { isLoading, isAuthenticated } = useSession();

  if (isAuthenticated) {
    return <Redirect redirectTo={routes.account} />;
  }

  return (
    <Box pos="relative">
      <LoadingOverlay visible={isLoading} overlayBlur={2} />
      <Stack spacing="xl">
        <Group grow mb="md" mt="md">
          <Button
            onClick={() => redirectOAuth('google')}
            leftIcon={<GithubIcon />}
            variant="default"
            color="gray"
            radius="xl"
          >
            Google
          </Button>
          <Button
            onClick={() => redirectOAuth('github')}
            leftIcon={<GithubIcon />}
            variant="default"
            color="gray"
            radius="xl"
          >
            Github
          </Button>
        </Group>
      </Stack>
    </Box>
  );
}
