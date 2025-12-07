import { useEffect } from 'react'
import { Form, Input, InputNumber, DatePicker, Switch, Button, Select, message } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useUpdatePromotionMutation } from '../../features/operator/promotionAPI'
import { CustomModal } from '../common'
import type { Promotion } from '../../types/Promotion'

interface UpdatePromotionModalProps {
  open: boolean
  onClose: () => void
  promotion: Promotion | null
}

const UpdatePromotionModal: React.FC<UpdatePromotionModalProps> = ({ open, onClose, promotion }) => {
  const [form] = Form.useForm()
  const [updatePromotion, { isLoading }] = useUpdatePromotionMutation()
  const discountType = Form.useWatch('discountType', form)

  const parseCurrency = (value: string | undefined): number => {
    if (!value) return 0
    const parsed = parseFloat(value.replace(/\$\s?|(,*)/g, ''))
    return isNaN(parsed) ? 0 : parsed
  }

  const parseNumber = (value: string | undefined): number => {
    if (!value) return 0
    const parsed = parseFloat(value.replace(/\$\s?|(,*)/g, ''))
    return isNaN(parsed) ? 0 : parsed
  }

  const formatPercentage = (value: number | undefined): string => {
    if (value === undefined || value === null) return ''
    return `${value}%`
  }

  const parsePercentage = (value: string | undefined): number => {
    if (!value) return 0
    const cleaned = value.replace(/%/g, '').trim()
    const parsed = parseFloat(cleaned)
    return isNaN(parsed) ? 0 : parsed
  }

  useEffect(() => {
    if (open && promotion) {
      form.setFieldsValue({
        name: promotion.name,
        description: promotion.description || '',
        discountType: promotion.discountType === 'PERCENTAGE' ? 'Percentage' : promotion.discountType,
        discountValue: promotion.discountValue,
        maxDiscountAmount: promotion.maxDiscountAmount || 0,
        startDate: dayjs(promotion.startDate),
        endDate: dayjs(promotion.endDate),
        totalUsageLimit: promotion.totalUsageLimit || 10,
        isActive: promotion.isActive !== undefined ? promotion.isActive : true,
      })
    } else if (open) {
      form.resetFields()
    }
  }, [open, promotion, form])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      if (!promotion?._id) {
        message.error('Không tìm thấy thông tin khuyến mãi')
        return
      }

      const promotionData = {
        id: promotion._id,
        name: values.name,
        description: values.description || '',
        discountType: values.discountType,
        discountValue: values.discountValue,
        maxDiscountAmount: values.maxDiscountAmount || 0,
        startDate: values.startDate.format('YYYY-MM-DDTHH:mm:ss.SSS[Z]'),
        endDate: values.endDate.format('YYYY-MM-DDTHH:mm:ss.SSS[Z]'),
        totalUsageLimit: values.totalUsageLimit || 10,
        isActive: values.isActive !== undefined ? values.isActive : true,
      }

      await updatePromotion(promotionData).unwrap()
      message.success('Cập nhật khuyến mãi thành công')
      form.resetFields()
      onClose()
    } catch (error: any) {
      message.error(error?.data?.message || 'Cập nhật khuyến mãi thất bại')
    }
  }

  const disabledStartDate = (current: Dayjs) => {
    // Cho phép chọn ngày trong quá khứ nếu đó là ngày bắt đầu hiện tại của promotion
    if (promotion?.startDate) {
      const promotionStartDate = dayjs(promotion.startDate).startOf('day')
      return current && current < promotionStartDate
    }
    return current && current < dayjs().startOf('day')
  }

  const disabledEndDate = (current: Dayjs) => {
    const startDate = form.getFieldValue('startDate')
    if (!startDate) {
      // Nếu chưa chọn startDate, cho phép chọn ngày >= ngày kết thúc hiện tại của promotion
      if (promotion?.endDate) {
        const promotionEndDate = dayjs(promotion.endDate).startOf('day')
        return current && current < promotionEndDate
      }
      return current && current < dayjs().startOf('day')
    }
    return current && current < startDate.startOf('day')
  }

  return (
    <CustomModal
      open={open}
      onClose={onClose}
      title="Chỉnh sửa khuyến mãi"
      width={700}
      loading={isLoading}
      footer={
        <>
          <Button onClick={onClose} disabled={isLoading}>
            Hủy
          </Button>
          <Button type="primary" onClick={handleSubmit} loading={isLoading}>
            Cập nhật
          </Button>
        </>
      }
    >
      <Form form={form} layout="vertical" className="update-promotion-form">
        <Form.Item
          name="name"
          label="Tên khuyến mãi"
          rules={[{ required: true, message: 'Vui lòng nhập tên khuyến mãi' }]}
        >
          <Input placeholder="Nhập tên khuyến mãi" />
        </Form.Item>

        <Form.Item name="description" label="Mô tả">
          <Input.TextArea rows={3} placeholder="Nhập mô tả khuyến mãi" />
        </Form.Item>

        <Form.Item
          name="discountType"
          label="Loại giảm giá"
          rules={[{ required: true, message: 'Vui lòng chọn loại giảm giá' }]}
        >
          <Select>
            <Select.Option value="Percentage">Phần trăm (%)</Select.Option>
            <Select.Option value="FixedAmount">Số tiền cố định (VND)</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="discountValue"
          label={discountType === 'Percentage' ? 'Phần trăm giảm giá' : 'Giá trị giảm giá (VND)'}
          rules={[
            { required: true, message: 'Vui lòng nhập giá trị giảm giá' },
            { type: 'number', min: 0.01, message: 'Giá trị phải lớn hơn 0' },
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            placeholder={discountType === 'Percentage' ? 'Nhập phần trăm (ví dụ: 10)' : 'Nhập số tiền giảm giá'}
            min={0.01}
            step={discountType === 'Percentage' ? 1 : 0.01}
            precision={discountType === 'Percentage' ? 0 : 2}
            formatter={discountType === 'Percentage' ? formatPercentage : undefined}
            parser={discountType === 'Percentage' ? parsePercentage : undefined}
            addonAfter={discountType === 'Percentage' ? '%' : '₫'}
          />
        </Form.Item>

        <Form.Item
          name="maxDiscountAmount"
          label="Giảm tối đa (VND)"
          tooltip="Số tiền tối đa được giảm (0 = không giới hạn)"
        >
          <InputNumber
            style={{ width: '100%' }}
            placeholder="Nhập số tiền giảm tối đa"
            min={0}
            step={1000}
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={parseCurrency}
          />
        </Form.Item>

        <Form.Item
          name="startDate"
          label="Ngày bắt đầu"
          rules={[{ required: true, message: 'Vui lòng chọn ngày bắt đầu' }]}
        >
          <DatePicker
            style={{ width: '100%' }}
            showTime
            format="DD/MM/YYYY HH:mm"
            placeholder="Chọn ngày bắt đầu"
            disabledDate={disabledStartDate}
          />
        </Form.Item>

        <Form.Item
          name="endDate"
          label="Ngày kết thúc"
          rules={[{ required: true, message: 'Vui lòng chọn ngày kết thúc' }]}
        >
          <DatePicker
            style={{ width: '100%' }}
            showTime
            format="DD/MM/YYYY HH:mm"
            placeholder="Chọn ngày kết thúc"
            disabledDate={disabledEndDate}
          />
        </Form.Item>

        <Form.Item
          name="totalUsageLimit"
          label="Giới hạn sử dụng"
          tooltip="Số lượt sử dụng tối đa"
        >
          <InputNumber
            style={{ width: '100%' }}
            placeholder="Nhập số lượt sử dụng tối đa"
            min={1}
            step={1}
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={parseNumber}
          />
        </Form.Item>

        <Form.Item name="isActive" label="Trạng thái" valuePropName="checked">
          <Switch checkedChildren="Hoạt động" unCheckedChildren="Vô hiệu" />
        </Form.Item>
      </Form>
    </CustomModal>
  )
}

export default UpdatePromotionModal

