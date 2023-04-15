import Document, { Html, Head, Main, NextScript } from 'next/document';
import Script from 'next/script';

import { createGetInitialProps } from '@mantine/next';

const getInitialProps = createGetInitialProps();

export default class _Document extends Document {
  static getInitialProps = getInitialProps;

  render() {
    return (
      <Html>
        <Head>
          <meta name="apple-mobile-web-app-title" content="TS Starter" />
          <meta name="application-name" content="TS Starter" />
          <meta name="theme-color" content="#ffffff" />
        </Head>
        <body>
          <Main />
          <NextScript />
          <Script strategy="beforeInteractive" src="/__ENV.js" />
        </body>
      </Html>
    );
  }
}
