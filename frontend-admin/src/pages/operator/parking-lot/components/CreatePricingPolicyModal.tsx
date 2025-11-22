import { useState, useEffect } from 'react'
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  TimePicker,
  Button,
  Space,
} from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import type { Basis } from '../../../../types/Basis'
import type { PricingPolicyLink } from '../../../../types/PricingPolicyLink'
import dayjs from 'dayjs'

interface CreatePricingPolicyModalProps {
  open: boolean
  onCancel: () => void
  onSubmit: (values: any) => Promise<void>
  parkingLotId: string
  basisList: Basis[]
  loading?: boolean
  initialData?: PricingPolicyLink | null
  isEditMode?: boolean
}

const CreatePricingPolicyModal: React.FC<CreatePricingPolicyModalProps> = ({
  open,
  onCancel,
  onSubmit,
  parkingLotId,
  basisList,
  loading = false,
  initialData = null,
  isEditMode = false,
}) => {
  const [form] = Form.useForm()
  const [selectedBasis, setSelectedBasis] = useState<Basis | null>(null)

  useEffect(() => {
    if (open) {
      if (isEditMode && initialData) {
        const policy = initialData.pricingPolicyId
        const basis = policy.basisId

        // Set basis first
        setSelectedBasis(basis)

        // Prepare form values
        const formValues: any = {
          basisId: basis._id,
          name: policy.name,
          priority: initialData.priority,
          startDate: dayjs(initialData.startDate),
        }

        // Set fields based on basis type
        if (basis.basisName === 'TIERED' && policy.tieredRateSetId) {
          formValues.tieredRateSet = {
            name: policy.tieredRateSetId.name,
            tiers: policy.tieredRateSetId.tiers.map((tier) => ({
              fromHour: tier.fromHour
                ? dayjs(`2000-01-01 ${tier.fromHour}`, 'YYYY-MM-DD HH:mm')
                : null,
              toHour: tier.toHour ? dayjs(`2000-01-01 ${tier.toHour}`, 'YYYY-MM-DD HH:mm') : null,
              price: tier.price,
            })),
          }
        } else if (basis.basisName === 'PACKAGE' && policy.packageRateId) {
          formValues.packageRate = {
            name: policy.packageRateId.name,
            price: policy.packageRateId.price,
            durationAmount: policy.packageRateId.durationAmount,
            unit: policy.packageRateId.unit,
          }
        } else if (basis.basisName === 'HOURLY') {
          formValues.pricePerHour = policy.pricePerHour
        } else if (basis.basisName === 'FIXED') {
          formValues.fixedPrice = policy.fixedPrice
        }

        form.setFieldsValue(formValues)
      } else {
        form.resetFields()
        setSelectedBasis(null)
      }
    }
  }, [open, form, isEditMode, initialData])

  const handleBasisChange = (basisId: string) => {
    const basis = basisList.find((b) => b._id === basisId)
    setSelectedBasis(basis || null)
    // Reset các trường liên quan đến basis
    form.setFieldsValue({
      pricePerHour: undefined,
      fixedPrice: undefined,
      tieredRateSet: undefined,
      packageRate: undefined,
    })
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      // Format startDate
      const startDate = values.startDate
        ? dayjs(values.startDate).toISOString()
        : dayjs().toISOString()

      // Build request body
      const requestBody: any = {
        parkingLotId,
        pricingPolicyId: {
          basisId: values.basisId,
          name: values.name,
        },
        priority: values.priority || 1,
        startDate,
      }

      // Add fields based on basis type
      if (selectedBasis?.basisName === 'TIERED') {
        // Convert dayjs objects to HH:mm format for tiers
        const formattedTiers = (values.tieredRateSet?.tiers || []).map((tier: any) => ({
          fromHour: tier.fromHour ? dayjs(tier.fromHour).format('HH:mm') : '',
          toHour: tier.toHour ? dayjs(tier.toHour).format('HH:mm') : null,
          price: tier.price || 0,
        }))

        requestBody.pricingPolicyId.tieredRateSet = {
          name: values.tieredRateSet?.name || '',
          tiers: formattedTiers,
        }
      } else if (selectedBasis?.basisName === 'PACKAGE') {
        requestBody.pricingPolicyId.packageRate = {
          name: values.packageRate?.name || '',
          price: values.packageRate?.price || 0,
          durationAmount: values.packageRate?.durationAmount || 1,
          unit: values.packageRate?.unit || 'month',
        }
      } else if (selectedBasis?.basisName === 'HOURLY') {
        requestBody.pricingPolicyId.pricePerHour = values.pricePerHour || 0
      } else if (selectedBasis?.basisName === 'FIXED') {
        requestBody.pricingPolicyId.fixedPrice = values.fixedPrice || 0
      }

      await onSubmit(requestBody)
      form.resetFields()
      setSelectedBasis(null)
    } catch (error) {
      console.error('Validation failed:', error)
    }
  }

  const basisName = selectedBasis?.basisName

  return (
    <Modal
      title={isEditMode ? 'Chỉnh sửa chính sách giá' : 'Tạo mới chính sách giá'}
      open={open}
      onCancel={onCancel}
      width={800}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Hủy
        </Button>,
        <Button key="submit" type="primary" onClick={handleSubmit} loading={loading}>
          {isEditMode ? 'Cập nhật' : 'Tạo mới'}
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="basisId"
          label="Loại cơ sở tính giá"
          rules={[{ required: true, message: 'Vui lòng chọn loại cơ sở tính giá' }]}
        >
          <Select
            placeholder="Chọn loại cơ sở tính giá"
            onChange={handleBasisChange}
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) =>
              String(option?.label ?? '')
                .toLowerCase()
                .includes(input.toLowerCase())
            }
          >
            {basisList.map((basis) => (
              <Select.Option key={basis._id} value={basis._id} label={basis.basisName}>
                {basis.basisName} - {basis.description}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="name"
          label="Tên chính sách"
          rules={[{ required: true, message: 'Vui lòng nhập tên chính sách' }]}
        >
          <Input placeholder="Nhập tên chính sách" />
        </Form.Item>

        <Form.Item
          name="priority"
          label="Ưu tiên"
          rules={[{ required: true, message: 'Vui lòng nhập mức ưu tiên' }]}
          initialValue={1}
        >
          <InputNumber
            min={1}
            max={10}
            placeholder="Nhập mức ưu tiên (1-10)"
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item
          name="startDate"
          label="Ngày bắt đầu áp dụng"
          rules={[
            { required: true, message: 'Vui lòng chọn ngày bắt đầu' },
            {
              validator: (_, value) => {
                if (!value) {
                  return Promise.resolve()
                }
                const minDate = dayjs().add(7, 'day').startOf('day')
                const selectedDate = dayjs(value).startOf('day')
                if (selectedDate.isBefore(minDate)) {
                  return Promise.reject(
                    new Error('Ngày bắt đầu phải sau ngày hiện tại ít nhất 7 ngày')
                  )
                }
                return Promise.resolve()
              },
            },
          ]}
        >
          <DatePicker
            style={{ width: '100%' }}
            format="DD/MM/YYYY"
            placeholder="Chọn ngày bắt đầu"
            disabledDate={(current) => {
              // Disable tất cả các ngày trước ngày hiện tại + 7 ngày
              return current && current.isBefore(dayjs().add(7, 'day').startOf('day'))
            }}
          />
        </Form.Item>

        {/* TIERED - Tiered Rate Set */}
        {basisName === 'TIERED' && (
          <Form.Item
            name={['tieredRateSet', 'name']}
            label="Tên bảng giá theo khung giờ"
            rules={[{ required: true, message: 'Vui lòng nhập tên bảng giá' }]}
          >
            <Input placeholder="Nhập tên bảng giá" />
          </Form.Item>
        )}

        {basisName === 'TIERED' && (
          <Form.Item
            name={['tieredRateSet', 'tiers']}
            label="Các khung giờ"
            rules={[
              { required: true, message: 'Vui lòng thêm ít nhất một khung giờ' },
              {
                validator: (_, value) => {
                  if (!value || value.length === 0) {
                    return Promise.reject(new Error('Vui lòng thêm ít nhất một khung giờ'))
                  }
                  return Promise.resolve()
                },
              },
            ]}
          >
            <Form.List name={['tieredRateSet', 'tiers']}>
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                      <Form.Item
                        {...restField}
                        name={[name, 'fromHour']}
                        rules={[{ required: true, message: 'Chọn giờ bắt đầu' }]}
                      >
                        <TimePicker
                          format="HH:mm"
                          placeholder="Từ giờ"
                          style={{ width: 120 }}
                          minuteStep={15}
                        />
                      </Form.Item>
                      <Form.Item {...restField} name={[name, 'toHour']}>
                        <TimePicker
                          format="HH:mm"
                          placeholder="Đến giờ (tùy chọn)"
                          style={{ width: 120 }}
                          minuteStep={15}
                        />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'price']}
                        rules={[{ required: true, message: 'Nhập giá' }]}
                      >
                        <InputNumber
                          placeholder="Giá"
                          min={0}
                          style={{ width: 150 }}
                          formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        />
                      </Form.Item>
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => remove(name)}
                      />
                    </Space>
                  ))}
                  <Form.Item>
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                      Thêm khung giờ
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </Form.Item>
        )}

        {/* PACKAGE - Package Rate */}
        {basisName === 'PACKAGE' && (
          <>
            <Form.Item
              name={['packageRate', 'name']}
              label="Tên gói"
              rules={[{ required: true, message: 'Vui lòng nhập tên gói' }]}
            >
              <Input placeholder="Nhập tên gói" />
            </Form.Item>
            <Form.Item
              name={['packageRate', 'price']}
              label="Giá gói"
              rules={[{ required: true, message: 'Vui lòng nhập giá gói' }]}
            >
              <InputNumber
                placeholder="Nhập giá gói"
                min={0}
                style={{ width: '100%' }}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              />
            </Form.Item>
            <Form.Item
              name={['packageRate', 'durationAmount']}
              label="Thời lượng"
              rules={[{ required: true, message: 'Vui lòng nhập thời lượng' }]}
            >
              <InputNumber placeholder="Nhập thời lượng" min={1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name={['packageRate', 'unit']}
              label="Đơn vị"
              rules={[{ required: true, message: 'Vui lòng chọn đơn vị' }]}
              initialValue="month"
            >
              <Select placeholder="Chọn đơn vị">
                <Select.Option value="hour">Giờ</Select.Option>
                <Select.Option value="day">Ngày</Select.Option>
                <Select.Option value="week">Tuần</Select.Option>
                <Select.Option value="month">Tháng</Select.Option>
                <Select.Option value="year">Năm</Select.Option>
              </Select>
            </Form.Item>
          </>
        )}

        {/* HOURLY - Price Per Hour */}
        {basisName === 'HOURLY' && (
          <Form.Item
            name="pricePerHour"
            label="Giá mỗi giờ"
            rules={[{ required: true, message: 'Vui lòng nhập giá mỗi giờ' }]}
          >
            <InputNumber
              placeholder="Nhập giá mỗi giờ"
              min={0}
              style={{ width: '100%' }}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            />
          </Form.Item>
        )}

        {/* FIXED - Fixed Price */}
        {basisName === 'FIXED' && (
          <Form.Item
            name="fixedPrice"
            label="Giá cố định"
            rules={[{ required: true, message: 'Vui lòng nhập giá cố định' }]}
          >
            <InputNumber
              placeholder="Nhập giá cố định"
              min={0}
              style={{ width: '100%' }}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            />
          </Form.Item>
        )}
      </Form>
    </Modal>
  )
}

export default CreatePricingPolicyModal
