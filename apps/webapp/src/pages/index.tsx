import { createPage } from '@/common/wrapper';
import { Box, Button, Group } from '@mantine/core';
import { NextSeo } from 'next-seo';
import { createStyles, Title, Text, Container } from '@mantine/core';
import { Dots } from '@/common/components/dots';
import { useTranslation } from '@/common/translations/use-translation';
import { BRAND_NAME } from '@/config';
import Router from 'next/router';
import { routes } from '@/routes';
import { useSession } from '@/common/session';
import { openLoginModal } from '@/common/components/login/lazy-login-form';

const useHeroStyles = createStyles((theme) => ({
  wrapper: {
    position: 'relative',
    paddingTop: 120,
    paddingBottom: 80,

    '@media (max-width: 755px)': {
      paddingTop: 80,
      paddingBottom: 60,
    },
  },

  inner: {
    position: 'relative',
    zIndex: 1,
  },

  dots: {
    position: 'absolute',
    color: theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[1],

    '@media (max-width: 755px)': {
      display: 'none',
    },
  },

  dotsLeft: {
    left: 0,
    top: 0,
  },

  title: {
    textAlign: 'center',
    fontWeight: 800,
    fontSize: 40,
    letterSpacing: -1,
    color: theme.colorScheme === 'dark' ? theme.white : theme.black,
    marginBottom: theme.spacing.xs,
    fontFamily: `Greycliff CF, ${theme.fontFamily}`,

    '@media (max-width: 520px)': {
      fontSize: 28,
      textAlign: 'left',
    },
  },

  highlight: {
    color: theme.colors[theme.primaryColor]![theme.colorScheme === 'dark' ? 4 : 6],
  },

  description: {
    textAlign: 'center',

    '@media (max-width: 520px)': {
      textAlign: 'left',
      fontSize: theme.fontSizes.md,
    },
  },
}));

const HeroText: React.FC = () => {
  const { classes } = useHeroStyles();
  const { t } = useTranslation();
  const { isAuthenticated } = useSession();

  const onCAClick = () => {
    if (isAuthenticated) {
      Router.push(routes.account);
      return;
    }

    openLoginModal(t('Log in or sign up'));
  };

  return (
    <Container className={classes.wrapper} size={1400}>
      <Dots className={classes.dots} style={{ left: 0, top: 0 }} />
      <Dots className={classes.dots} style={{ left: 60, top: 0 }} />
      <Dots className={classes.dots} style={{ left: 0, top: 140 }} />
      <Dots className={classes.dots} style={{ right: 0, top: 60 }} />

      <div className={classes.inner}>
        <Title className={classes.title}>NextJS webapp for {BRAND_NAME}</Title>

        <Container p={0} size={600}>
          <Text size="lg" color="dimmed" className={classes.description}>
            You can change the brandname in ./src/config.ts file
          </Text>
        </Container>

        <Group position="center" mt="lg">
          <Button onClick={onCAClick} variant="gradient" size="xl">
            {t('Get Started')}
          </Button>
        </Group>
      </div>
    </Container>
  );
};

const home = createPage({
  pageComponent: function HomePage() {
    return (
      <Box py="md">
        <NextSeo title="Home" />
        <HeroText />
      </Box>
    );
  },
});

export default home;
