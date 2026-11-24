import { RouterProvider } from '@tanstack/react-router';
import { createRouter } from '@/app/router';

const router = createRouter();

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
