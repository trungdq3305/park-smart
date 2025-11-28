import { useEffect } from 'react'
import { Modal, Form, InputNumber, Input, Button, DatePicker } from 'antd'
import type { ParkingLot } from '../../../../types/ParkingLot'
import dayjs from 'dayjs'

interface UpdateParkingLotModalProps {
  open: boolean
  onCancel: () => void
  onSubmit: (values: any) => Promise<void>
  parkingLot: ParkingLot | null
  loading?: boolean
}

const UpdateParkingLotModal: React.FC<UpdateParkingLotModalProps> = ({
  open,
  onCancel,
  onSubmit,
  parkingLot,
  loading = false,
}) => {
  const [form] = Form.useForm()

  useEffect(() => {
    if (open && parkingLot) {
      form.setFieldsValue({
        name: parkingLot.addressId?.wardId?.wardName || '',
        totalCapacityEachLevel: parkingLot.totalCapacityEachLevel,
        totalLevel: parkingLot.totalLevel,
        bookingSlotDurationHours: parkingLot.bookingSlotDurationHours,
        bookableCapacity: parkingLot.bookableCapacity,
        leasedCapacity: parkingLot.leasedCapacity,
        walkInCapacity: parkingLot.walkInCapacity,
        effectiveDate: dayjs().add(7, 'day'), // Mặc định 7 ngày sau
      })
    } else if (open) {
      form.resetFields()
    }
  }, [open, parkingLot, form])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      // Chuyển đổi effectiveDate từ dayjs sang string format YYYY-MM-DD
      const submitValues = {
        ...values,
        effectiveDate: values.effectiveDate ? values.effectiveDate.format('YYYY-MM-DD') : undefined,
      }
      await onSubmit(submitValues)
      form.resetFields()
    } catch (error) {
      console.error('Validation failed:', error)
    }
  }

  return (
    <Modal
      title="Gửi yêu cầu cập nhật bãi đỗ xe"
      open={open}
      onCancel={onCancel}
      width={600}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Hủy
        </Button>,
        <Button key="submit" type="primary" onClick={handleSubmit} loading={loading}>
          Gửi yêu cầu
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="Tên bãi đỗ xe"
          rules={[{ required: true, message: 'Vui lòng nhập tên bãi đỗ xe' }]}
        >
          <Input placeholder="Nhập tên bãi đỗ xe" />
        </Form.Item>

        <Form.Item
          name="effectiveDate"
          label="Ngày hiệu lực"
          rules={[{ required: true, message: 'Vui lòng chọn ngày hiệu lực' }]}
        >
          <DatePicker
            style={{ width: '100%' }}
            format="DD/MM/YYYY"
            placeholder="Chọn ngày hiệu lực"
            disabledDate={(current) => {
              // Chỉ cho phép chọn ngày từ hôm nay trở đi
              return current && current < dayjs().startOf('day')
            }}
          />
        </Form.Item>

        <Form.Item
          name="totalCapacityEachLevel"
          label="Sức chứa mỗi tầng"
          rules={[{ required: true, message: 'Vui lòng nhập sức chứa mỗi tầng' }]}
        >
          <InputNumber min={1} placeholder="Nhập sức chứa mỗi tầng" style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="totalLevel"
          label="Tổng số tầng"
          rules={[{ required: true, message: 'Vui lòng nhập tổng số tầng' }]}
        >
          <InputNumber min={1} placeholder="Nhập tổng số tầng" style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="bookingSlotDurationHours"
          label="Thời lượng đặt chỗ (giờ)"
          rules={[{ required: true, message: 'Vui lòng nhập thời lượng đặt chỗ' }]}
        >
          <InputNumber min={1} placeholder="Nhập thời lượng đặt chỗ" style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="bookableCapacity"
          label="Sức chứa có thể đặt"
          rules={[{ required: true, message: 'Vui lòng nhập sức chứa có thể đặt' }]}
        >
          <InputNumber min={0} placeholder="Nhập sức chứa có thể đặt" style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="leasedCapacity"
          label="Sức chứa cho thuê"
          rules={[{ required: true, message: 'Vui lòng nhập sức chứa cho thuê' }]}
        >
          <InputNumber min={0} placeholder="Nhập sức chứa cho thuê" style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="walkInCapacity"
          label="Sức chứa khách vãng lai"
          rules={[{ required: true, message: 'Vui lòng nhập sức chứa khách vãng lai' }]}
        >
          <InputNumber
            min={0}
            placeholder="Nhập sức chứa khách vãng lai"
            style={{ width: '100%' }}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default UpdateParkingLotModal
