import { signOut } from '@/common/auth';
import { createAuthPage } from '@/common/wrapper';
import { useSession } from '@/common/session';
import { Button, Container } from '@mantine/core';
import Router from 'next/router';
import { useEffect } from 'react';

const page = createAuthPage({
  pageComponent: function Accout() {
    const { isLoading, user } = useSession();

    // redirect to login
    useEffect(() => {
      if (!isLoading && !user) {
        Router.replace('/login');
      }
    }, [isLoading, user]);

    return (
      <Container>
        <p>loading: {isLoading ? 'loading' : 'done'}</p>
        <p>{JSON.stringify(user, null, 2)}</p>
        <Button onClick={() => signOut()}>Sign out</Button>
      </Container>
    );
  },
});

export default page;
