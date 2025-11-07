import React, { useState } from 'react'
import { Card, Typography, Button, Table, Tag, Space, message, Popconfirm, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined, EditOutlined, DeleteOutlined, FileTextOutlined } from '@ant-design/icons'
import {
  useCreateTermsPolicyMutation,
  useDeleteTermsPolicyMutation,
  useGetTermsPoliciesQuery,
  useUpdateTermsPolicyMutation,
} from '../../../features/admin/termsAPI'
import type { TermPolicy } from '../../../types/TAPs'
import TermsPolicyModal, {
  type TermsPolicyFormValues,
} from '../../../components/modals/TermsPolicyModal'
import './ManageTermsPolicies.css'

const { Title, Paragraph, Text } = Typography

interface TermsPoliciesResponse {
  data: {
    data: TermPolicy[]
  }
  isLoading: boolean
}

const ManageTermsPolicies: React.FC = () => {
  const { data: termsPolicies, isLoading } = useGetTermsPoliciesQuery<TermsPoliciesResponse>({})
  const [createTermsPolicy, { isLoading: isCreating }] = useCreateTermsPolicyMutation()
  const [updateTermsPolicy, { isLoading: isUpdating }] = useUpdateTermsPolicyMutation()
  const [deleteTermsPolicy, { isLoading: isDeleting }] = useDeleteTermsPolicyMutation()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<TermPolicy | null>(null)

  const termsPoliciesData = termsPolicies?.data || []
  const openCreate = () => {
    setEditingItem(null)
    setIsModalOpen(true)
  }

  const openEdit = (record: TermPolicy) => {
    setEditingItem(record)
    setIsModalOpen(true)
  }

  const handleSubmit = async (values: TermsPolicyFormValues) => {
    try {
      if (editingItem) {
        await updateTermsPolicy({ id: editingItem.id, ...values }).unwrap()
        message.success('Cập nhật thành công')
      } else {
        await createTermsPolicy(values).unwrap()
        message.success('Tạo mới thành công')
      }
      setIsModalOpen(false)
    } catch (err: unknown) {
      const apiMsg =
        (err as { data?: { message: string }; error?: string })?.data?.message ||
        (err as { error?: string })?.error ||
        'Có lỗi xảy ra'
      message.error(apiMsg)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteTermsPolicy(id).unwrap()
      message.success('Đã xoá')
    } catch (err: unknown) {
      const apiMsg =
        (err as { data?: { message: string }; error?: string })?.data?.message ||
        (err as { error?: string })?.error ||
        'Xoá thất bại'
      message.error(apiMsg)
    }
  }

  const columns: ColumnsType<TermPolicy> = [
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      responsive: ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'],
      render: (text: string) => (
        <Space>
          <FileTextOutlined />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      responsive: ['md', 'lg', 'xl', 'xxl'],
      render: (text: string) => (
        <Tooltip title={text} placement="topLeft">
          <span style={{ color: '#5f6b7a' }}>{text}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Cập nhật',
      key: 'updatedAt',
      responsive: ['lg', 'xl', 'xxl'],
      render: (_: unknown, record: TermPolicy) => {
        const updated = record?.updatedAt || record?.createdAt
        return <Tag color="blue">{updated ? new Date(updated).toLocaleString('vi-VN') : '-'}</Tag>
      },
      width: 180,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_: unknown, record: TermPolicy) => (
        <Space wrap>
          <Button icon={<EditOutlined />} onClick={() => openEdit(record)}>
            Sửa
          </Button>
          <Popconfirm
            title="Xoá mục này?"
            description="Hành động không thể hoàn tác"
            okText="Xoá"
            okButtonProps={{ danger: true }}
            cancelText="Huỷ"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button danger icon={<DeleteOutlined />}>
              Xoá
            </Button>
          </Popconfirm>
        </Space>
      ),
      width: 200,
      fixed: 'right',
    },
  ]

  return (
    <div className="taps-container" style={{ padding: '2.4vh' }}>
      <Card
        style={{ borderRadius: '1.6vh', boxShadow: '0 0.8vh 2.4vh rgba(0,0,0,0.06)' }}
        title={
          <div
            className="taps-header"
            style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}
          >
            <div>
              <Title level={3} style={{ margin: 0 }}>
                Quản lý Terms & Policies
              </Title>
              <Paragraph type="secondary" style={{ margin: 0 }}>
                Tạo, chỉnh sửa và xoá điều khoản/chính sách
              </Paragraph>
            </div>
            <Button
              className="taps-add-btn"
              type="primary"
              icon={<PlusOutlined />}
              onClick={openCreate}
            >
              Thêm mới
            </Button>
          </div>
        }
      >
        <Table
          rowKey="id"
          loading={isLoading || isCreating || isUpdating || isDeleting}
          dataSource={termsPoliciesData}
          columns={columns}
          pagination={{ pageSize: 8, showSizeChanger: false, responsive: true }}
          size="middle"
          scroll={{ x: '72vh' }}
        />
      </Card>

      <TermsPolicyModal
        open={isModalOpen}
        loading={isCreating || isUpdating}
        title={editingItem ? 'Chỉnh sửa điều khoản/chính sách' : 'Tạo điều khoản/chính sách'}
        okText={editingItem ? 'Lưu thay đổi' : 'Tạo mới'}
        initialValues={{
          title: editingItem?.title || '',
          description: editingItem?.description || '',
          content: editingItem?.content || '',
        }}
        onCancel={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  )
}

export default ManageTermsPolicies
