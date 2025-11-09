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
  Modal,
  List,
  Empty,
  Descriptions,
  Badge,
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
  CheckCircleOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  TagOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import './CreateReport.css'

dayjs.extend(utc)
dayjs.extend(timezone)

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

  const formatDate = (dateString: string) => {
    // Parse UTC time and keep it as UTC (don't convert to local timezone)
    return dayjs.utc(dateString).format('DD/MM/YYYY HH:mm')
  }
  const onFinish = async (values: any) => {
    try {
      const payload = {
        parkingLotId: values.parkingLotId || null,
        categoryId: values.categoryId,
        reason: values.reason,
      }

      await createReport(payload).unwrap()
      message.success('Báo cáo đã được gửi thành công! Admin sẽ xem xét và phản hồi sớm nhất.')
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
              Gửi báo cáo chi tiết về vấn đề, đề xuất hoặc phản hồi để Admin xem xét và xử lý
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
                Operator
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

      <Modal
        title={
          <Space>
            <HistoryOutlined />
            <span>Danh sách báo cáo đã gửi</span>
            <Badge count={myReports.length} showZero color="#667eea" />
          </Space>
        }
        open={isModalVisible}
        onCancel={handleCancel}
        footer={[
          <Button key="close" onClick={handleCancel} size="large">
            Đóng
          </Button>,
        ]}
        width={900}
        className="reports-modal"
      >
        {isLoadingMyReports ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Typography.Text type="secondary">Đang tải...</Typography.Text>
          </div>
        ) : myReports.length === 0 ? (
          <Empty
            description="Bạn chưa gửi báo cáo nào"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ padding: '40px 0' }}
          />
        ) : (
          <List
            dataSource={myReports}
            pagination={{
              pageSize: 5,
              showSizeChanger: false,
              showTotal: (total) => `Tổng cộng ${total} báo cáo`,
            }}
            renderItem={(report: Report) => (
              <List.Item className="report-item">
                <Card
                  className="report-card"
                  style={{
                    width: '100%',
                    marginBottom: 16,
                    borderLeft: `4px solid ${report.isProcessed ? '#52c41a' : '#faad14'}`,
                  }}
                >
                  <Space direction="vertical" size={12} style={{ width: '100%' }}>
                    <Row justify="space-between" align="middle">
                      <Col>
                        <Space>
                          <TagOutlined style={{ color: '#667eea' }} />
                          <Typography.Text strong style={{ fontSize: 16 }}>
                            {report.category?.name || 'Không có loại'}
                          </Typography.Text>
                        </Space>
                      </Col>
                      <Col>
                        <Badge
                          status={report.isProcessed ? 'success' : 'processing'}
                          text={
                            report.isProcessed ? (
                              <span style={{ color: '#52c41a' }}>
                                <CheckCircleOutlined /> Đã xử lý
                              </span>
                            ) : (
                              <span style={{ color: '#faad14' }}>
                                <ClockCircleOutlined /> Đang chờ xử lý
                              </span>
                            )
                          }
                        />
                      </Col>
                    </Row>

                    <Divider style={{ margin: '12px 0' }} />

                    <Descriptions column={1} size="small" bordered>
                      <Descriptions.Item
                        label={
                          <Space>
                            <FileTextOutlined />
                            <span>Nội dung báo cáo</span>
                          </Space>
                        }
                      >
                        <Typography.Paragraph
                          style={{ margin: 0, whiteSpace: 'pre-wrap' }}
                          ellipsis={{ rows: 3, expandable: true, symbol: 'Xem thêm' }}
                        >
                          {report.reason}
                        </Typography.Paragraph>
                      </Descriptions.Item>

                      {report.parkingLotId && (
                        <Descriptions.Item
                          label={
                            <Space>
                              <InfoCircleOutlined />
                              <span>ID Bãi đỗ xe</span>
                            </Space>
                          }
                        >
                          <Typography.Text code>{report.parkingLotId}</Typography.Text>
                        </Descriptions.Item>
                      )}

                      {report.isProcessed && report.response && (
                        <Descriptions.Item
                          label={
                            <Space>
                              <CheckCircleOutlined style={{ color: '#52c41a' }} />
                              <span>Phản hồi từ Admin</span>
                            </Space>
                          }
                        >
                          <Typography.Paragraph
                            style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#52c41a' }}
                            ellipsis={{ rows: 2, expandable: true, symbol: 'Xem thêm' }}
                          >
                            {report.response}
                          </Typography.Paragraph>
                        </Descriptions.Item>
                      )}

                      <Descriptions.Item
                        label={
                          <Space>
                            <CalendarOutlined />
                            <span>Thời gian</span>
                          </Space>
                        }
                      >
                        <Space direction="vertical" size={4}>
                          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                            <strong>Gửi lúc:</strong> {formatDate(report.createdAt)}
                          </Typography.Text>
                          {report.updatedAt !== report.createdAt && (
                            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                              <strong>Xử lý lúc:</strong> {formatDate(report.updatedAt)}
                            </Typography.Text>
                          )}
                        </Space>
                      </Descriptions.Item>
                    </Descriptions>
                  </Space>
                </Card>
              </List.Item>
            )}
          />
        )}
      </Modal>
    </Space>
  )
}

export default CreateReport
