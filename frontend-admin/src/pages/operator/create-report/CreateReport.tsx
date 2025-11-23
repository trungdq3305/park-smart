import React, { useState } from 'react'
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  Row,
  Space,
  message,
  Typography,
  Select,
  Divider,
  Tag,
  Alert,
} from 'antd'
import { useGetReportCategoriesQuery } from '../../../features/admin/reportCategoryAPI'
import { useCreateReportMutation, useGetMyReportsQuery } from '../../../features/admin/reportAPI'
import type { ReportCategory } from '../../../types/ReportCategory'
import type { Report } from '../../../types/Report'
import {
  FileTextOutlined,
  SendOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  HistoryOutlined,
} from '@ant-design/icons'
import ViewReportsModal from '../../../components/modals/ViewReportsModal'
import './CreateReport.css'

const { TextArea } = Input

interface ReportCategoryResponse {
  data: {
    data: ReportCategory[]
  }
  isLoading: boolean
}
interface MyReportsResponse {
  data: {
    data: Report[]
  }
  isLoading: boolean
}
const CreateReport: React.FC = () => {
  const [form] = Form.useForm()
  const [isModalVisible, setIsModalVisible] = useState(false)
  const { data: reportCategoriesData, isLoading: isLoadingReportCategories } =
    useGetReportCategoriesQuery<ReportCategoryResponse>({})
  const reportCategories = reportCategoriesData?.data || []
  const [createReport, { isLoading }] = useCreateReportMutation()
  const {
    data: myReportsData,
    isLoading: isLoadingMyReports,
    refetch,
  } = useGetMyReportsQuery<MyReportsResponse>({})
  const myReports = (myReportsData as unknown as { data: Report[] })?.data || []

  const showModal = () => {
    setIsModalVisible(true)
    refetch()
  }

  const handleCancel = () => {
    setIsModalVisible(false)
  }
  const onFinish = async (values: any) => {
    try {
      const payload = {
        parkingLotId: values.parkingLotId || null,
        categoryId: values.categoryId,
        reason: values.reason,
      }

      await createReport(payload).unwrap()
      message.success(
        'Báo cáo đã được gửi thành công! Quản trị viên sẽ xem xét và phản hồi sớm nhất.'
      )
      form.resetFields()
      refetch()
    } catch (err: unknown) {
      const extractMessage = (e: unknown): string => {
        if (typeof e === 'object' && e !== null) {
          const withData = e as { data?: unknown; message?: unknown }
          if (withData.data && typeof (withData.data as any).message === 'string') {
            return (withData.data as any).message as string
          }
          if (typeof withData.message === 'string') return withData.message
        }
        if (e instanceof Error) return e.message
        if (typeof e === 'string') return e
        return 'Gửi báo cáo thất bại'
      }

      message.error(extractMessage(err))
    }
  }

  return (
    <Space direction="vertical" size={24} className="create-report-wrapper">
      <Card className="create-report-hero">
        <Row align="middle" gutter={[16, 16]}>
          <Col flex="none">
            <div className="hero-icon">
              <FileTextOutlined style={{ fontSize: 28, color: '#fff' }} />
            </div>
          </Col>
          <Col flex="auto">
            <Typography.Title level={3} className="hero-title" style={{ color: '#fff' }}>
              Tạo báo cáo mới
            </Typography.Title>
            <Typography.Paragraph className="hero-subtitle">
              Gửi báo cáo chi tiết về vấn đề, đề xuất hoặc phản hồi để Quản trị viên xem xét và xử
              lý
            </Typography.Paragraph>
          </Col>
          <Col flex="none">
            <Space>
              <Button
                type="default"
                icon={<HistoryOutlined />}
                onClick={showModal}
                size="large"
                className="view-reports-button"
              >
                Xem báo cáo đã gửi
              </Button>
              <Tag color="gold" className="hero-badge">
                Chủ bãi xe
              </Tag>
            </Space>
          </Col>
        </Row>
      </Card>

      <Alert
        message="Hướng dẫn"
        description="Vui lòng điền đầy đủ thông tin báo cáo. Báo cáo của bạn sẽ được Admin xem xét và phản hồi trong thời gian sớm nhất."
        type="info"
        icon={<InfoCircleOutlined />}
        showIcon
        closable
        style={{ marginBottom: 0 }}
      />

      <Card
        title={
          <span>
            <FileTextOutlined /> Thông tin báo cáo
          </span>
        }
        className="section-card"
      >
        <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false} size="large">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Form.Item
                label={
                  <Space>
                    <ExclamationCircleOutlined />
                    <span>Loại báo cáo</span>
                  </Space>
                }
                name="categoryId"
                rules={[{ required: true, message: 'Vui lòng chọn loại báo cáo' }]}
              >
                <Select
                  placeholder="Chọn loại báo cáo"
                  loading={isLoadingReportCategories}
                  showSearch
                  optionFilterProp="label"
                  notFoundContent={
                    isLoadingReportCategories ? 'Đang tải...' : 'Không tìm thấy loại báo cáo'
                  }
                  options={reportCategories.map((category: ReportCategory) => ({
                    key: category._id,
                    label: category.name,
                    value: category._id,
                    title: category.description,
                  }))}
                />
              </Form.Item>
            </Col>

            <Col xs={24} lg={12}>
              <Form.Item
                label={
                  <Space>
                    <InfoCircleOutlined />
                    <span>ID Bãi đỗ xe (Tùy chọn)</span>
                  </Space>
                }
                name="parkingLotId"
                tooltip="Nếu báo cáo liên quan đến một bãi đỗ xe cụ thể, vui lòng nhập ID"
              >
                <Input placeholder="VD: 507f1f77bcf86cd799439011" />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <Form.Item
            label={
              <Space>
                <FileTextOutlined />
                <span>Nội dung báo cáo</span>
              </Space>
            }
            name="reason"
            rules={[
              { required: true, message: 'Vui lòng nhập nội dung báo cáo' },
              { min: 20, message: 'Nội dung báo cáo phải có ít nhất 20 ký tự' },
              { max: 2000, message: 'Nội dung báo cáo không được vượt quá 2000 ký tự' },
            ]}
            extra="Vui lòng mô tả chi tiết vấn đề, đề xuất hoặc phản hồi của bạn (tối thiểu 20 ký tự)"
          >
            <TextArea
              rows={8}
              placeholder="Nhập nội dung báo cáo chi tiết tại đây..."
              showCount
              maxLength={2000}
              style={{ resize: 'vertical' }}
            />
          </Form.Item>

          <Space className="form-actions" size="middle">
            <Button icon={<ReloadOutlined />} onClick={() => form.resetFields()} size="large">
              Làm mới
            </Button>
            <Button
              type="primary"
              icon={<SendOutlined />}
              htmlType="submit"
              loading={isLoading}
              size="large"
              className="submit-button"
            >
              Gửi báo cáo
            </Button>
          </Space>
        </Form>
      </Card>

      <ViewReportsModal
        open={isModalVisible}
        onCancel={handleCancel}
        reports={myReports}
        isLoading={isLoadingMyReports}
      />
    </Space>
  )
}

export default CreateReport
