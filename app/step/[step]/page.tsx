import Home from '../../page';

export function generateStaticParams() {
  return ['1', '2', '3', '4', '5', '6'].map((step) => ({ step }));
}

export const dynamicParams = false;

export default function StepPage() {
  return <Home />;
}
