import React from 'react'
import {
  Modal,
  Button,
  List,
  Empty,
  Descriptions,
  Badge,
  Space,
  Typography,
  Card,
  Row,
  Col,
  Divider,
} from 'antd'
import type { Report } from '../../types/Report'
import {
  HistoryOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  TagOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

interface ViewReportsModalProps {
  open: boolean
  onCancel: () => void
  reports: Report[]
  isLoading: boolean
}

const ViewReportsModal: React.FC<ViewReportsModalProps> = ({
  open,
  onCancel,
  reports,
  isLoading,
}) => {
  const formatDate = (dateString: string) => {
    // Parse UTC time and keep it as UTC (don't convert to local timezone)
    return dayjs.utc(dateString).format('DD/MM/YYYY HH:mm')
  }

  return (
    <Modal
      title={
        <Space>
          <HistoryOutlined />
          <span>Danh sách báo cáo đã gửi</span>
          <Badge count={reports.length} showZero color="#667eea" />
        </Space>
      }
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="close" onClick={onCancel} size="large">
          Đóng
        </Button>,
      ]}
      width={900}
      className="reports-modal"
    >
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Typography.Text type="secondary">Đang tải...</Typography.Text>
        </div>
      ) : reports.length === 0 ? (
        <Empty
          description="Bạn chưa gửi báo cáo nào"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ padding: '40px 0' }}
        />
      ) : (
        <List
          dataSource={reports}
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
  )
}

export default ViewReportsModal
