import { ColorScheme, ColorSchemeProvider, MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PropsWithChildren, ReactElement, /* useEffect, */ useRef } from 'react';
import { useColorScheme, useLocalStorage } from '@mantine/hooks';
import { AuthProvider } from './session';
import AuthGuard from './components/auth-guard';
import { Notifications } from '@mantine/notifications';
import { routes } from '@/routes';
import { createPageLayout } from './layout';
import { ModalsProvider } from '@mantine/modals';

export type TPageProps<PageProps extends { [key: string]: any }> = {
  pageComponent: (props: PageProps) => ReactElement<any, any> | null;
  /**
   * Set the props of NextSEO plugin, see https://github.com/garmeeh/next-seo.
   *
   * Props are only defined when using getStaticProps or getServersideProps
   */
  // nextSeoProps?: (props: PageProps) => NextSeoProps;
  layout?: (props: { children: JSX.Element }) => JSX.Element;
};

export type TPage<PageProps extends { [key: string]: any }> = {
  (props: PageProps): JSX.Element;
  getWrapper(children: JSX.Element, pageProps: PageProps): JSX.Element;
};

const expires = new Date();
const maxAge = 60 * 24 * 60 * 60; // in seconds
expires.setTime(expires.getTime() + maxAge * 1000);

const App: React.FC<PropsWithChildren> = ({ children }) => {
  // const router = useRouter();

  const systemColorScheme = useColorScheme();

  const [colorScheme, setColorScheme] = useLocalStorage<ColorScheme>({
    key: 'color-scheme',
    defaultValue: systemColorScheme,
  });
  const toggleColorScheme = (value?: ColorScheme) => {
    const nextColorScheme = value || (colorScheme === 'dark' ? 'light' : 'dark');
    setColorScheme(nextColorScheme);
  };

  // use ref such that it is created once
  const queryClientRef = useRef<QueryClient>();
  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient({
      defaultOptions: {},
    });
  }

  return (
    <ColorSchemeProvider colorScheme={colorScheme} toggleColorScheme={toggleColorScheme}>
      <MantineProvider
        withGlobalStyles
        withNormalizeCSS
        theme={{
          colorScheme,
          primaryColor: 'blue',
          // primaryShade: { light: 4, dark: 6 },
          defaultRadius: 'md',
          defaultGradient: { from: 'blue', to: 'cyan', deg: 45 },
          components: {
            Paper: {
              defaultProps: {
                shadow: 'xs',
              },
            },
            Card: {
              defaultProps: {
                shadow: 'xs',
              },
            },
            Checkbox: {
              defaultProps: {
                size: 'md',
              },
            },
            Button: {
              defaultProps: {
                size: 'md',
              },
            },
            TextInput: {
              defaultProps: {
                size: 'md',
              },
            },
            Textarea: {
              defaultProps: {
                size: 'md',
              },
            },
            Select: {
              defaultProps: {
                size: 'md',
              },
            },
          },
        }}
      >
        <Notifications />
        <QueryClientProvider client={queryClientRef.current}>
          <AuthProvider>
            <ModalsProvider>{children}</ModalsProvider>
          </AuthProvider>
        </QueryClientProvider>
      </MantineProvider>
    </ColorSchemeProvider>
  );
};

/**
 * Create an wrapper
 * @param props
 * @returns
 */
export const _createWrapper = <TProps extends { [key: string]: any }>(props: TPageProps<TProps>): TPage<TProps> => {
  const C = props.pageComponent;
  const Comp = (pageProps: TProps) => <C {...pageProps} />;
  Comp.getWrapper = (children: JSX.Element, _pageProps: TProps) => (
    <>
      {/* {props.nextSeoProps && <NextSeo {...props.nextSeoProps(pageProps)} />} */}
      <App>{props.layout ? props.layout({ children }) : children}</App>
    </>
  );
  return Comp;
};

export const createAuthPage = <TProps extends { [key: string]: any }>({
  pageComponent,
  layout = createPageLayout,
}: // layout,
TPageProps<TProps>): TPage<TProps> => {
  const Comp = _createWrapper({ pageComponent: pageComponent, layout });

  const getWrapperFn = Comp.getWrapper;

  Comp.getWrapper = (children, pageProps) =>
    getWrapperFn(<AuthGuard redirectTo={routes.login}>{children}</AuthGuard>, pageProps);

  return Comp;
};

export const createPage = <TProps extends { [key: string]: any }>({
  pageComponent,
  layout = createPageLayout,
}: // layout,
TPageProps<TProps>): TPage<TProps> => {
  const Comp = _createWrapper({ pageComponent: pageComponent, layout });

  const getWrapperFn = Comp.getWrapper;

  Comp.getWrapper = (children, pageProps) => getWrapperFn(children, pageProps);

  return Comp;
};
