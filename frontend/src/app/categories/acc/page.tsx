import AccClient from './components/AccClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mua Bán Tài Khoản Game | Shop Thịnh Sáng',
  description: 'Danh sách tài khoản game giá rẻ, uy tín. Bàn giao nhanh chóng tự động sau khi đặt mua trực tiếp bằng ví.',
};

export default async function Page(props: {
  searchParams?: Promise<{ gamecode?: string }>;
}) {
  const searchParams = await props.searchParams;
  return <AccClient gamecode={searchParams?.gamecode} />;
}
