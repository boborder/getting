import { Dock } from '~/components/layout/Dock'
import { Footer } from '~/components/layout/Footer'
import { Header } from '~/components/layout/Header'
import { Nav } from '~/components/layout/Nav'
import { Sidebar } from '~/components/layout/Sidebar'

export const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className='drawer lg:drawer-open'>
      <Header />
      <Sidebar />
      <main className='drawer-content container mx-auto pt-16 pb-72 sm:pb-56'>
        <Nav />
        {children}
      </main>
      <Footer />
      <Dock />
    </div>
  )
}
