import type { AppProps } from 'next/app'
import '../index.css'
import '../App.scss';
import '../components/button/Button.scss';
import '../components/toggle/Toggle.scss';
import '../pages/ConsolePage.scss';
export default function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}