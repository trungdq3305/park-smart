import React, { useEffect, useRef } from 'react'
import { Modal, Form, Input } from 'antd'
import type { InputRef } from 'antd'

export interface TermsPolicyFormValues {
    title: string
    description: string
    content: string
}

interface TermsPolicyModalProps {
    open: boolean
    loading: boolean
    initialValues: TermsPolicyFormValues
    title: string
    okText: string
    onCancel: () => void
    onSubmit: (values: TermsPolicyFormValues) => Promise<void> | void
}

const TermsPolicyModal: React.FC<TermsPolicyModalProps> = ({
    open,
    loading,
    initialValues,
    title,
    okText,
    onCancel,
    onSubmit,
}) => {
    const [form] = Form.useForm<TermsPolicyFormValues>()
    const initialFocusRef = useRef<InputRef | null>(null)

    useEffect(() => {
        if (open) {
            form.setFieldsValue(initialValues)
        }
    }, [open, initialValues, form])

    const handleOk = async () => {
        const values = await form.validateFields()
        await onSubmit(values)
        form.resetFields()
    }

    return (
        <Modal
            open={open}
            title={title}
            onCancel={onCancel}
            onOk={handleOk}
            okText={okText}
            okButtonProps={{ loading }}
            afterOpenChange={(isOpen) => {
                if (isOpen) {
                    setTimeout(() => initialFocusRef.current?.focus(), 50)
                }
            }}
            destroyOnClose
        >
            <Form form={form} layout="vertical" initialValues={initialValues}>
                <Form.Item label="Tiêu đề" name="title" rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}>
                    <Input ref={initialFocusRef} placeholder="Nhập tiêu đề" maxLength={150} showCount />
                </Form.Item>
                <Form.Item label="Mô tả ngắn" name="description" rules={[{ required: true, message: 'Vui lòng nhập mô tả' }]}>
                    <Input placeholder="Mô tả ngắn gọn nội dung" maxLength={200} showCount />
                </Form.Item>
                <Form.Item label="Nội dung" name="content" rules={[{ required: true, message: 'Vui lòng nhập nội dung' }]}>
                    <Input.TextArea rows={8} placeholder="Nhập nội dung chi tiết" />
                </Form.Item>
            </Form>
        </Modal>
    )
}

export default TermsPolicyModal


