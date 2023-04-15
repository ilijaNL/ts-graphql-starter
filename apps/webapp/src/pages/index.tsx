import { createWrapper } from '@/common/factories/wrapper';
import { routes } from '@/routes';
import { Button, Container } from '@mantine/core';
import Link from 'next/link';

const page = createWrapper({
  pageComponent: function Home() {
    return (
      <>
        <Container>
          <Link href={routes.login} passHref>
            <Button>Sign in</Button>
          </Link>
          <Link href={routes.account} passHref>
            <Button>Account</Button>
          </Link>
        </Container>
      </>
    );
  },
});

export default page;
