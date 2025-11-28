import ErrorBoundary from '@/components/ErrorBoundary';

export default function ClientsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}
