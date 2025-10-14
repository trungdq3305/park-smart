import React from 'react'
import { Card, Row, Col, Statistic, Progress, Table, Tag, Button, Space } from 'antd'
import { 
  CarOutlined, 
  DollarOutlined, 
  ClockCircleOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons'

const ManageAccountPage: React.FC = () => {
  // Sample data for parking lots
  const parkingLotsData = [
    {
      key: '1',
      id: 'PL001',
      name: 'Downtown Mall Parking',
      location: '123 Main St, Downtown',
      totalSpots: 150,
      availableSpots: 45,
      hourlyRate: 2.50,
      status: 'Active'
    },
    {
      key: '2',
      id: 'PL002',
      name: 'Central Station Parking',
      location: '456 Station Ave, Central',
      totalSpots: 200,
      availableSpots: 78,
      hourlyRate: 3.00,
      status: 'Active'
    },
    {
      key: '3',
      id: 'PL003',
      name: 'University Campus Parking',
      location: '789 University Blvd, Campus',
      totalSpots: 300,
      availableSpots: 120,
      hourlyRate: 1.50,
      status: 'Maintenance'
    },
  ]

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: 'Capacity',
      key: 'capacity',
      render: (record: any) => (
        <div>
          <div>{record.availableSpots}/{record.totalSpots} spots</div>
          <Progress 
            percent={Math.round((record.availableSpots / record.totalSpots) * 100)} 
            size="small" 
            status={record.availableSpots < 20 ? 'exception' : 'active'}
          />
        </div>
      ),
    },
    {
      title: 'Hourly Rate',
      dataIndex: 'hourlyRate',
      key: 'hourlyRate',
      render: (rate: number) => `$${rate.toFixed(2)}/hr`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'Active' ? 'green' : 'orange'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: () => (
        <Space>
          <Button icon={<EditOutlined />} size="small">Edit</Button>
          <Button icon={<DeleteOutlined />} size="small" danger>Delete</Button>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ padding: '24px', background: 'white', minHeight: '100vh' }}>
      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Parking Lots"
              value={12}
              prefix={<CarOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Spots"
              value={2400}
              prefix={<CarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Available Spots"
              value={856}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Today's Revenue"
              value={2847}
              prefix={<DollarOutlined />}
              precision={2}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Parking Lots Management */}
      <Card
        title="Parking Lots Management"
        extra={
          <Button type="primary" icon={<PlusOutlined />}>
            Add New Parking Lot
          </Button>
        }
        style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
      >
        <Table
          columns={columns}
          dataSource={parkingLotsData}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  )
}

export default ManageAccountPage
