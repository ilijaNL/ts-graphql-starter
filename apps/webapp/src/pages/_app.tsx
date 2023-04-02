import type { NextPage } from 'next';
import Head from 'next/head';
import type { AppProps } from 'next/app';

type EnhancedAppProps = AppProps & {
  Component: NextPage;
};

const App: React.FC<EnhancedAppProps> = (appProps) => {
  const { Component, pageProps } = appProps;
  const getWrapper = (Component as any).getWrapper ?? ((page: React.ReactNode) => page);

  return (
    <>
      <Head>
        <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width" />
      </Head>

      {getWrapper(<Component {...pageProps} />)}
    </>
  );
};

export default App;
