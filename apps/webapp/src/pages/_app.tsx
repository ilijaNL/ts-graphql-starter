import Head from 'next/head';
import type { AppProps } from 'next/app';
import type { TPage } from '@/common/wrapper';

type EnhancedAppProps = AppProps & {
  Component: TPage<any>;
};

const App: React.FC<EnhancedAppProps> = (appProps) => {
  const { Component, pageProps } = appProps;
  const getWrapper = Component.getWrapper ?? ((page: React.ReactNode) => page);

  return (
    <>
      <Head>
        <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width" />
      </Head>

      {getWrapper(<Component {...pageProps} />, pageProps)}
    </>
  );
};

export default App;
