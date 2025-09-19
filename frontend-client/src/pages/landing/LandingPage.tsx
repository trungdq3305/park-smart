import { Layout } from "antd";
import type React from "react";
import HomePage from "../../components/home-page/HomePage";
const { Content } = Layout

const LandingPage: React.FC = () => {
    return (
        <Layout>
            <Content>
                <HomePage />
            </Content>
        </Layout>
    )
}
export default LandingPage
