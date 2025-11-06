import React, {useRef, useState } from 'react'
import { Card, Typography, Button, Table, Tag, Space, Modal, Form, Input, message, Popconfirm, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { InputRef } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, FileTextOutlined } from '@ant-design/icons'
import { useCreateTermsPolicyMutation, useDeleteTermsPolicyMutation, useGetTermsPoliciesQuery, useUpdateTermsPolicyMutation } from '../../../features/admin/termsAPI'
import type { TermPolicy } from '../../../types/TAPs'

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
    const [form] = Form.useForm()
    const initialFocusRef = useRef<InputRef | null>(null)
const termsPoliciesData = termsPolicies?.data || []
    const openCreate = () => {
        setEditingItem(null)
        form.resetFields()
        setIsModalOpen(true)
    }

    const openEdit = (record: TermPolicy) => {
        setEditingItem(record)
        form.setFieldsValue({
            title: record.title,
            description: record.description,
            content: record.content,
        })
        setIsModalOpen(true)
    }

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields()
            if (editingItem) {
                await updateTermsPolicy({ id: editingItem.id, ...values }).unwrap()
                message.success('Cập nhật thành công')
            } else {
                await createTermsPolicy(values).unwrap()
                message.success('Tạo mới thành công')
            }
            setIsModalOpen(false)
            form.resetFields()
        } catch (err: unknown) {
            const apiMsg = (err as { data?: { message: string }; error?: string })?.data?.message || (err as { error?: string })?.error || 'Có lỗi xảy ra'
            message.error(apiMsg)
        }
    }

    const handleDelete = async (id: string) => {
        try {
            await deleteTermsPolicy(id).unwrap()
            message.success('Đã xoá')
        } catch (err: unknown) {
            const apiMsg = (err as { data?: { message: string }; error?: string })?.data?.message || (err as { error?: string })?.error || 'Xoá thất bại'
            message.error(apiMsg)
        }
    }

    const columns: ColumnsType<TermPolicy> = [
        {
            title: 'Tiêu đề',
            dataIndex: 'title',
            key: 'title',
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
            render: (text: string) => (
                <Tooltip title={text} placement="topLeft">
                    <span style={{ color: '#5f6b7a' }}>{text}</span>
                </Tooltip>
            ),
        },
        {
            title: 'Cập nhật',
            key: 'updatedAt',
            render: (_: unknown, record: TermPolicy) => {
                const updated = record?.updatedAt || record?.createdAt
                return <Tag color="blue">{updated ? new Date(updated).toLocaleString('vi-VN') : '-'}</Tag>
            },
            width: 200,
        },
        {
            title: 'Thao tác',
            key: 'actions',
            render: (_: unknown, record: TermPolicy) => (
                <Space>
                    <Button icon={<EditOutlined />} onClick={() => openEdit(record)}>Sửa</Button>
                    <Popconfirm
                        title="Xoá mục này?"
                        description="Hành động không thể hoàn tác"
                        okText="Xoá"
                        okButtonProps={{ danger: true }}
                        cancelText="Huỷ"
                        onConfirm={() => handleDelete(record.id)}
                    >
                        <Button danger icon={<DeleteOutlined />}>Xoá</Button>
                    </Popconfirm>
                </Space>
            ),
            width: 200,
        },
    ]

    return (
        <div style={{ padding: 24 }}>
            <Card
                bordered={false}
                style={{ borderRadius: 16, boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}
                title={
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                        <div>
                            <Title level={3} style={{ margin: 0 }}>Quản lý Terms & Policies</Title>
                            <Paragraph type="secondary" style={{ margin: 0 }}>Tạo, chỉnh sửa và xoá điều khoản/chính sách</Paragraph>
                        </div>
                        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Thêm mới</Button>
                    </div>
                }
            >
                <Table
                    rowKey="id"
                    loading={isLoading || isCreating || isUpdating || isDeleting}
                    dataSource={termsPoliciesData}
                    columns={columns}
                    pagination={{ pageSize: 8, showSizeChanger: false }}
                />
            </Card>

            <Modal
                open={isModalOpen}
                title={editingItem ? 'Chỉnh sửa điều khoản/chính sách' : 'Tạo điều khoản/chính sách'}
                onCancel={() => setIsModalOpen(false)}
                onOk={handleSubmit}
                okText={editingItem ? 'Lưu thay đổi' : 'Tạo mới'}
                okButtonProps={{ loading: isCreating || isUpdating }}
                afterOpenChange={(open) => {
                    if (open) setTimeout(() => initialFocusRef.current?.focus(), 50)
                }}
            >
                <Form form={form} layout="vertical" initialValues={{ title: '', description: '', content: '' }}>
                    <Form.Item label="Tiêu đề" name="title" rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}>
                        <Input ref={initialFocusRef as any} placeholder="Nhập tiêu đề" maxLength={150} showCount />
                    </Form.Item>
                    <Form.Item label="Mô tả ngắn" name="description" rules={[{ required: true, message: 'Vui lòng nhập mô tả' }]}>
                        <Input placeholder="Mô tả ngắn gọn nội dung" maxLength={200} showCount />
                    </Form.Item>
                    <Form.Item label="Nội dung" name="content" rules={[{ required: true, message: 'Vui lòng nhập nội dung' }]}>
                        <Input.TextArea rows={8} placeholder="Nhập nội dung chi tiết" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}

export default ManageTermsPolicies  