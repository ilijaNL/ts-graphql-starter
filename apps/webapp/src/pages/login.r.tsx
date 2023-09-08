import { createPage } from '@/common/wrapper';
import { useSessionRedirect } from '@/common/session';
import { GithubIcon } from '@mantine/ds';
import { TextInput, Text, Paper, Group, Button, Divider, Stack, Container } from '@mantine/core';
import { useForm } from 'react-hook-form';
import { redirectOAuth } from '@/common/auth';

const page = createPage({
  pageComponent: function Login() {
    // redirect to account when in session
    useSessionRedirect((session) => {
      return session.isAuthenticated;
    }, '/account');

    const { handleSubmit, register } = useForm<{
      email: string;
    }>({});

    return (
      <Container size="sm" my={40}>
        <Paper radius="md" p="xl" withBorder>
          <Text size="lg" weight={500}>
            Welcome to Mantine, login with
          </Text>

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
            <Button leftIcon={<GithubIcon />} variant="default" color="gray" radius="xl">
              LinkedIn
            </Button>
          </Group>

          <Divider label="Or continue with email" labelPosition="center" my="lg" />

          <form
            onSubmit={handleSubmit((d) => {
              console.log({ d });
            })}
          >
            <Stack>
              <TextInput required {...register('email')} label="Email" placeholder="hello@mantine.dev" radius="md" />
            </Stack>

            <Group position="apart" mt="xl">
              <Button type="submit" radius="xl">
                Login
              </Button>
            </Group>
          </form>
        </Paper>
      </Container>
    );
  },
});

export default page;
