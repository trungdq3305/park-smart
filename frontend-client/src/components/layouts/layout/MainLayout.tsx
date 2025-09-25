import { Outlet } from 'react-router-dom'
import { Layout } from 'antd'
const { Content } = Layout
import NavBar from '../navbar/NavBar'
import Footer from '../../footer/Footer'
function MainLayout() {

    return (
        <Layout
            style={{
                minHeight: '100vh',
                overflow: 'hidden',
            }}
        >
            <NavBar />
            <Content
            >
                <Outlet />
            </Content>
            <Footer />
        </Layout>
    )
}

export default MainLayout
