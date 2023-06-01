import {
  ActionIcon,
  Anchor,
  AppShell,
  Burger,
  Button,
  clsx,
  Container,
  createStyles,
  Footer,
  getStylesRef,
  Group,
  Header,
  MediaQuery,
  Menu,
  Navbar,
  ThemeIcon,
  Title,
  UnstyledButton,
  useMantineColorScheme,
  useMantineTheme,
} from '@mantine/core';
import {
  IconChevronDown,
  IconHome,
  IconLogout,
  IconMoonStars,
  IconSettings,
  IconSun,
  IconBolt,
} from '@tabler/icons-react';
import { PropsWithChildren, useEffect, useState } from 'react';
import { Router, useRouter } from 'next/router';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import Link from 'next/link';
import { routes } from '@/routes';
import { match, P } from 'ts-pattern';
import { useSession } from './session';
import { signOut } from './auth';
import { LanguageSwitch } from './components/language-switch';
import { useTranslation } from './translations/use-translation';
import AuthAvatar from './components/auth-avatar';
import { BRAND_NAME } from '@/config';
import { LogoIcon } from './components/logo-icon';
import { openLoginModal } from './components/login/lazy-login-form';

const useStyles = createStyles((theme) => ({
  user: {
    color: theme.colorScheme === 'dark' ? theme.colors.dark[0] : theme.black,
    borderRadius: theme.radius.sm,
    transition: 'background-color 100ms ease',

    '&:hover': {
      backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[8] : theme.white,
    },

    [theme.fn.smallerThan('xs')]: {
      display: 'none',
    },
  },

  userActive: {
    backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[8] : theme.white,
  },
  link: {
    display: 'flex',
    alignItems: 'center',
    height: '100%',
    paddingLeft: theme.spacing.md,
    paddingRight: theme.spacing.md,
    textDecoration: 'none',
    color: theme.colorScheme === 'dark' ? theme.white : theme.black,
    fontWeight: 500,
    fontSize: theme.fontSizes.sm,

    [theme.fn.smallerThan('sm')]: {
      height: 42,
      display: 'flex',
      alignItems: 'center',
      width: '100%',
    },

    ...theme.fn.hover({
      backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
    }),
  },

  subLink: {
    width: '100%',
    padding: `${theme.spacing.xs} ${theme.spacing.md}`,
    borderRadius: theme.radius.md,

    ...theme.fn.hover({
      backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.colors.gray[0],
    }),

    '&:active': theme.activeStyles,
  },

  dropdownFooter: {
    backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.colors.gray[0],
    margin: -theme.spacing.md,
    marginTop: theme.spacing.sm,
    padding: `${theme.spacing.md} ${theme.spacing.md}`,
    paddingBottom: theme.spacing.xl,
    borderTop: `1px solid ${theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[1]}`,
  },

  hiddenMobile: {
    [theme.fn.smallerThan('sm')]: {
      display: 'none',
    },
  },

  hiddenDesktop: {
    [theme.fn.largerThan('sm')]: {
      display: 'none',
    },
  },

  footer: {
    height: '100%',
    padding: `${theme.spacing.xs} ${theme.spacing.md}`,
    borderTop: `1px solid ${theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[2]}`,
  },

  links: {
    [theme.fn.smallerThan('sm')]: {
      marginTop: theme.spacing.lg,
      marginBottom: theme.spacing.sm,
    },
  },
}));

interface FooterProps {
  links: { link: string; label: string }[];
}

function LogoWithLinkAndText() {
  return (
    <Link
      href={routes.home}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        textDecoration: 'none',
        height: '100%',
        color: 'inherit',
      }}
    >
      <LogoIcon />
      <Title order={2} sx={(theme) => ({ marginLeft: theme.spacing.md, fontWeight: 700, letterSpacing: '-.05em' })}>
        {BRAND_NAME}
      </Title>
    </Link>
  );
}

function SiteFooter({ links }: FooterProps) {
  const { classes } = useStyles();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  const items = links.map((link) => (
    <Anchor key={link.label} href={link.link} component={Link} color="dimmed" sx={{ lineHeight: 1 }} size="sm">
      {link.label}
    </Anchor>
  ));

  return (
    <Container size="xl" className={classes.footer}>
      <Group
        position="apart"
        spacing="sm"
        noWrap
        // breakpoints={[{ maxWidth: 'sm', cols: 1, spacing: 'md' }]}
      >
        <ThemeIcon size={32} radius="md" color="blue">
          <IconBolt strokeWidth={1.2} />
        </ThemeIcon>
        <Group position="center" className={classes.links}>
          {items}
        </Group>

        <MediaQuery smallerThan="sm" styles={{ display: 'none' }}>
          <Group spacing="xs" position="right" noWrap>
            {/* <ActionIcon title="Twitter" size="lg" variant="default" radius="xl">
            <IconBrandTwitter size={18} stroke={1.5} />
          </ActionIcon>
          <ActionIcon title="Youtube" size="lg" variant="default" radius="xl">
            <IconBrandYoutube size={18} stroke={1.5} />
          </ActionIcon> */}
            {/* <Link href="https://www.instagram.com/wishify.link/" passHref>
            <ActionIcon component="a" target="_blank" title="Instagram" size="lg" variant="default" radius="xl">
              <IconBrandInstagram size={18} stroke={1.5} />
            </ActionIcon>
          </Link> */}
            <ActionIcon
              onClick={() => toggleColorScheme()}
              size="lg"
              title="Switch dark mode"
              variant="default"
              radius="xl"
              sx={(theme) => ({
                backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
                color: theme.colorScheme === 'dark' ? theme.colors.yellow[4] : theme.colors.gray[7],
              })}
            >
              {colorScheme === 'dark' ? <IconSun size={18} /> : <IconMoonStars size={18} />}
            </ActionIcon>
            <LanguageSwitch />
          </Group>
        </MediaQuery>
      </Group>
    </Container>
  );
}

// const LoginForm = dynamic(() => import('./components/login-form'));

const PageHeader: React.FC<{ onBurgerClick: () => void; menuOpen: boolean }> = ({ onBurgerClick, menuOpen }) => {
  const { classes } = useStyles();
  const session = useSession();
  const { t } = useTranslation();
  const [userMenuOpened, setUserMenuOpened] = useState(false);

  return (
    <Container p={0} size="xl" sx={{ height: '100%' }}>
      <Group position="apart" sx={{ height: '100%' }}>
        <LogoWithLinkAndText />
        <Group className={classes.hiddenMobile}>
          {match(session)
            .with({ isAuthenticated: true, user: P.not(P.nullish) }, () => (
              <Menu
                position="bottom"
                radius="md"
                onClose={() => setUserMenuOpened(false)}
                onOpen={() => setUserMenuOpened(true)}
              >
                <Menu.Target>
                  <UnstyledButton
                    component="button"
                    title="user menu"
                    className={clsx(classes.user, { [classes.userActive]: userMenuOpened })}
                  >
                    <Group spacing={2}>
                      <AuthAvatar />
                      <IconChevronDown size={18} />
                    </Group>
                  </UnstyledButton>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Label>Home</Menu.Label>
                  <Menu.Item component={Link} href={routes.home} icon={<IconSettings size={20} />}>
                    Home
                  </Menu.Item>
                  <Menu.Label>Settings</Menu.Label>
                  <Menu.Item component={Link} href={routes.account} icon={<IconSettings size={20} />}>
                    Account settings
                  </Menu.Item>
                  <Menu.Item
                    icon={<IconLogout size={20} />}
                    onClick={() => {
                      return signOut();
                    }}
                  >
                    Logout
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            ))
            .otherwise(() => (
              <Button
                variant="gradient"
                radius="md"
                id="cta_get_started_header"
                onClick={() => openLoginModal(t('Log in or sign up'))}
              >
                {t('Get Started')}
              </Button>
            ))}
        </Group>
        <Burger opened={menuOpen} onClick={onBurgerClick} className={classes.hiddenDesktop} />
      </Group>
    </Container>
  );
};

const useNavBarStyles = createStyles((theme, _params) => {
  const icon = getStylesRef('icon');
  return {
    footer: {
      paddingTop: theme.spacing.md,
      marginTop: theme.spacing.md,
      borderTop: `1px solid ${theme.colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[2]}`,
    },

    link: {
      ...theme.fn.focusStyles(),
      display: 'flex',
      alignItems: 'center',
      textDecoration: 'none',
      fontSize: theme.fontSizes.sm,
      color: theme.colorScheme === 'dark' ? theme.colors.dark[1] : theme.colors.gray[7],
      padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
      borderRadius: theme.radius.sm,
      fontWeight: 500,

      '&:hover': {
        backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
        color: theme.colorScheme === 'dark' ? theme.white : theme.black,

        [`& .${icon}`]: {
          color: theme.colorScheme === 'dark' ? theme.white : theme.black,
        },
      },
    },

    linkIcon: {
      ref: icon,
      color: theme.colorScheme === 'dark' ? theme.colors.dark[2] : theme.colors.gray[6],
      marginRight: theme.spacing.sm,
    },

    linkActive: {
      '&, &:hover': {
        backgroundColor: theme.fn.variant({ variant: 'light', color: theme.primaryColor }).background,
        color: theme.fn.variant({ variant: 'light', color: theme.primaryColor }).color,
        [`& .${icon}`]: {
          color: theme.fn.variant({ variant: 'light', color: theme.primaryColor }).color,
        },
      },
    },
  };
});

const authNavBarItems = [{ link: routes.account, label: 'Settings', icon: IconSettings }] as const;

const publicNavBarItems = [
  { link: routes.home, label: 'Home', icon: IconHome },
  // { link: routes.privacy, label: 'Privacy Policy', icon: IconSpyOff },
  // { link: routes.terms, label: 'Terms of service', icon: IconCheckbox },
] as const;

const MobileNavBar: React.FC<{}> = () => {
  const { classes, cx } = useNavBarStyles();
  const session = useSession();
  const { pathname } = useRouter();
  const { t } = useTranslation();

  if (session.isAuthenticated) {
    return (
      <>
        <Navbar.Section grow>
          {authNavBarItems.map((item) => (
            <Link
              href={item.link}
              key={item.label}
              className={cx(classes.link, { [classes.linkActive]: pathname === item.link })}
            >
              <item.icon className={classes.linkIcon} stroke={1.5} />
              <span>{item.label}</span>
            </Link>
          ))}
        </Navbar.Section>
        <Navbar.Section className={classes.footer}>
          <Group position="center" grow>
            <Button component="a" variant="outline" onClick={() => signOut()}>
              Logout
            </Button>
          </Group>
        </Navbar.Section>
      </>
    );
  }

  return (
    <>
      <Navbar.Section grow>
        {publicNavBarItems.map((item) => (
          <Link
            href={item.link}
            key={item.label}
            className={cx(classes.link, { [classes.linkActive]: pathname === item.link })}
          >
            <item.icon className={classes.linkIcon} stroke={1.5} />
            <span>{item.label}</span>
          </Link>
        ))}
      </Navbar.Section>
      <Navbar.Section className={classes.footer}>
        <Group position="center" grow>
          <Button component={Link} href={routes.login} variant="gradient">
            {t('Log in or sign up')}
          </Button>
        </Group>
      </Navbar.Section>
    </>
  );
};

const ResponsiveAppShell = (props: PropsWithChildren) => {
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] = useDisclosure(false);
  const theme = useMantineTheme();
  const isDesktop = useMediaQuery(`(min-width: ${theme.breakpoints['sm']})`);
  // const isDesktop = useIsDesktop();

  // listen for route events and close mobile navbar when on page
  useEffect(() => {
    const close = () => closeDrawer();

    Router.events.on('routeChangeComplete', close);

    return () => Router.events.off('routeChangeComplete', close);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isDesktop && drawerOpened) {
      closeDrawer();
    }
  }, [isDesktop, drawerOpened, closeDrawer]);

  return (
    <AppShell
      fixed={true}
      navbarOffsetBreakpoint={99999}
      padding={0}
      navbar={
        <Navbar
          p="md"
          hiddenBreakpoint={99999}
          hidden={drawerOpened !== true}
          sx={{ height: 'calc(100vh - var(--mantine-header-height, 0px))' }}
        >
          <MobileNavBar />
        </Navbar>
      }
      styles={(_) => ({
        main: {
          backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark![8] : theme.colors.gray![0],
          // boxShadow: `inset 0 0 0 50vw ${theme.fn.rgba(
          //   theme.colorScheme === 'dark' ? theme.colors.dark![8] : theme.colors.gray![0],
          //   theme.colorScheme === 'dark' ? 0.45 : 0.95
          // )}`,
          minHeight: 'calc(100vh - var(--mantine-footer-height, 0px) + 0px)',
        },
      })}
      header={
        <Header height={60} p="xs">
          <PageHeader onBurgerClick={toggleDrawer} menuOpen={drawerOpened === true} />
        </Header>
      }
      footer={
        <Footer height={70} style={{ position: 'static', overflow: 'hidden' }}>
          <SiteFooter
            links={
              [
                // { label: t('Privacy Policy'), link: routes.privacy },
                // { label: t('Terms of service'), link: routes.terms },
              ]
            }
          />
        </Footer>
      }
    >
      {props.children}
    </AppShell>
  );
};

export function createPageLayout(props: { children: JSX.Element }) {
  return <ResponsiveAppShell>{props.children}</ResponsiveAppShell>;
}
