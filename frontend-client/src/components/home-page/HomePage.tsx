import React, { useEffect, useRef, useState } from 'react'
import {
  Button,
  Card,
  Avatar,
  Tag,
} from 'antd'
import {
  EnvironmentOutlined,
  PhoneOutlined,
  CarOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  SmileOutlined,
  MailOutlined,
  YoutubeOutlined,
  InstagramOutlined,
  FacebookFilled,
  LinkedinFilled,
} from '@ant-design/icons'
import ParkingLotMap from './ParkingLotMap'
import './HomePage.css'

// Custom hook for scroll animations
interface ScrollAnimationOptions {
  threshold?: number
  rootMargin?: string
}

const useScrollAnimation = (options: ScrollAnimationOptions = {}) => {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Cập nhật trạng thái dựa trên việc element có trong viewport hay không
        setIsVisible(entry.isIntersecting)
      },
      {
        threshold: options.threshold || 0.1,
        rootMargin: options.rootMargin || '0px 0px -50px 0px',
      }
    )

    const currentRef = ref.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [options.threshold, options.rootMargin])

  return [ref, isVisible] as const
}

// Animated Feature Card Component
const AnimatedFeatureCard: React.FC<{
  feature: { icon: React.ReactNode; title: string; description: string }
  index: number
}> = ({ feature, index }) => {
  const [cardRef, cardVisible] = useScrollAnimation()
  return (
    <div
      ref={cardRef}
      className={`feature-card-wrapper ${cardVisible ? 'animate-in' : ''}`}
      style={{ animationDelay: `${index * 0.15}s` }}
    >
      <Card className="feature-card">
        <div className="feature-icon">{feature.icon}</div>
        <h3>{feature.title}</h3>
        <p>{feature.description}</p>
      </Card>
    </div>
  )
}

// Animated Benefit Card Component
const AnimatedBenefitCard: React.FC<{
  item: { title: string; description: string }
  index: number
}> = ({ item, index }) => {
  const [cardRef, cardVisible] = useScrollAnimation()
  return (
    <div
      ref={cardRef}
      className={`benefit-card-wrapper ${cardVisible ? 'animate-in' : ''}`}
      style={{ animationDelay: `${index * 0.2}s` }}
    >
      <Card key={item.title} bordered={false} className="benefit-card">
        <h4>{item.title}</h4>
        <p>{item.description}</p>
      </Card>
    </div>
  )
}

// Animated Testimonial Card Component
const AnimatedTestimonialCard: React.FC<{
  item: { avatar: string; name: string; role: string; comment: string }
  index: number
}> = ({ item, index }) => {
  const [cardRef, cardVisible] = useScrollAnimation()
  return (
    <div
      ref={cardRef}
      className={`testimonial-card-wrapper ${cardVisible ? 'animate-in' : ''}`}
      style={{ animationDelay: `${index * 0.15}s` }}
    >
      <Card key={item.name} bordered={false} className="testimonial-card">
        <div className="testimonial-header">
          <Avatar size={48}>{item.avatar}</Avatar>
          <div>
            <h4>{item.name}</h4>
            <span>{item.role}</span>
          </div>
        </div>
        <p className="testimonial-comment">"{item.comment}"</p>
      </Card>
    </div>
  )
}

const featureHighlights = [
  {
    icon: <CarOutlined />,
    title: 'Đặt chỗ cực nhanh',
    description:
      'Tìm kiếm và giữ chỗ bãi đỗ phù hợp trong vài bước đơn giản, loại bỏ mọi rắc rối khi tới nơi.',
  },
  {
    icon: <SafetyOutlined />,
    title: 'An toàn & minh bạch',
    description:
      'Hệ thống đánh giá đa chiều, bảo hiểm cho xe và thông tin hiển thị rõ ràng giúp bạn yên tâm tuyệt đối.',
  },
  {
    icon: <ThunderboltOutlined />,
    title: 'Giá ưu đãi độc quyền',
    description:
      'So sánh giá theo thời gian thực, nhận ưu đãi đặc biệt từ các đối tác chỉ có trên ParkSmart.',
  },
]

const benefitCards = [
  {
    title: 'Theo dõi thời gian thực',
    description: 'Cập nhật liên tục trạng thái bãi đỗ, vị trí trống và điều hướng trực tiếp.',
  },
  {
    title: 'Hệ sinh thái đối tác',
    description: 'Kết nối với hệ thống bãi đỗ lớn, trung tâm thương mại, sân bay và khách sạn.',
  },
  {
    title: 'Ứng dụng đa nền tảng',
    description: 'Đặt chỗ, gia hạn và thanh toán dễ dàng trên web và Android.',
  },
]

const testimonials = [
  {
    avatar: 'NT',
    name: 'Nguyễn Thành',
    role: 'Chủ bãi xe trung tâm Q.1',
    comment:
      'ParkSmart giúp chúng tôi lấp đầy chỗ trống nhanh hơn 40% và giảm hẳn thời gian xử lý thủ công.',
  },
  {
    avatar: 'LT',
    name: 'Lê Trang',
    role: 'Nhân viên văn phòng',
    comment:
      'Chỉ mất 30 giây để đặt chỗ trước giờ làm. Tôi không còn lo hết chỗ mỗi sáng nữa, rất tiện lợi.',
  },
  {
    avatar: 'QP',
    name: 'Quang Phúc',
    role: 'Khách hàng thân thiết',
    comment:
      'Giao diện thân thiện, giá cả rõ ràng và nhiều ưu đãi hấp dẫn. ParkSmart xứng đáng là lựa chọn số 1.',
  },
]


const HomePage: React.FC = () => {
  const [heroRef, heroVisible] = useScrollAnimation({ threshold: 0.2 })
  const [featuresHeadingRef, featuresHeadingVisible] = useScrollAnimation()
  const [benefitsTextRef, benefitsTextVisible] = useScrollAnimation()
  const [testimonialsHeadingRef, testimonialsHeadingVisible] = useScrollAnimation()

  // Parallax effect for hero
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.pageYOffset
      const heroOverlay = document.querySelector('.hero-overlay') as HTMLElement
      if (heroOverlay) {
        heroOverlay.style.transform = `translateY(${scrolled * 0.5}px)`
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="landing-container">
      <header className="landing-hero">
        <div className="hero-overlay" />
        <div className="landing-nav">
          <div className="brand">
            <span className="brand-logo">P</span>
            <span className="brand-name">ParkSmart</span>
          </div>
          <nav className="nav-links">
            <a href="#booking">Đặt chỗ</a>
            <a href="#features">Tính năng</a>
            <a href="#benefits">Lợi ích</a>
            <a href="#testimonials">Khách hàng</a>
          </nav>
          <div className="nav-actions">
            <Button
              size="large"
              type="primary"
              onClick={() => window.open('https://park-smart-two.vercel.app/', '_blank')}
            >
              Trở thành đối tác
            </Button>
          </div>
        </div>

        <div ref={heroRef} className={`hero-content ${heroVisible ? 'animate-in' : ''}`}>
          <div className="hero-text">
            <Tag color="green" className="hero-tag">
              Nền tảng quản lý bãi đỗ xe #1 Việt Nam
            </Tag>
            <h1>
              Giải pháp đặt chỗ và vận hành bãi đỗ xe <span>toàn diện</span>
            </h1>
            <p>
              Tối ưu doanh thu cho chủ bãi, mang đến trải nghiệm đỗ xe nhanh chóng và minh bạch cho
              người dùng
            </p>
          </div>

          <Card id="booking" className="hero-form-card">
            <h3>Tìm bãi đỗ xe gần bạn</h3>
            <p className="form-subtitle">Xem các bãi đỗ xe có sẵn trên bản đồ, di chuyển để khám phá thêm</p>
            <ParkingLotMap />
            <div className="form-meta">
              <ClockCircleOutlined /> Giữ chỗ miễn phí trong 45 phút • <SmileOutlined /> Hỗ trợ
              khách hàng 24/7
            </div>
          </Card>
        </div>
      </header>

      <section id="features" className="features-section">
        <div
          ref={featuresHeadingRef}
          className={`section-heading ${featuresHeadingVisible ? 'animate-in' : ''}`}
        >
          <Tag color="green">Tại sao chọn ParkSmart?</Tag>
          <h2>Trải nghiệm đỗ xe thông minh và liền mạch</h2>
          <p>
            ParkSmart kết nối bạn với hệ sinh thái bãi đỗ xe hiện đại, giúp tiết kiệm thời gian, chi
            phí và đảm bảo an toàn tối đa cho phương tiện.
          </p>
        </div>

        <div className="features-grid">
          {featureHighlights.map((feature, index) => (
            <AnimatedFeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </section>

      <section id="benefits" className="benefits-section">
        <div className="benefits-content">
          <div
            ref={benefitsTextRef}
            className={`benefits-text ${benefitsTextVisible ? 'animate-in' : ''}`}
          >
            <Tag color="green">Dành cho chủ bãi & doanh nghiệp</Tag>
            <h2>Tăng trưởng doanh thu và vận hành dễ dàng</h2>
            <p>
              ParkSmart cung cấp bộ công cụ quản trị toàn diện từ theo dõi công suất thời gian thực,
              quản lý đặt chỗ đến báo cáo doanh thu chi tiết. Bạn chỉ cần vài phút để khởi tạo, mọi
              quy trình đều tự động và trực quan.
            </p>
            <ul className="benefits-list">
              <li>
                <EnvironmentOutlined />
                <span>Định vị và điều hướng thông minh cho khách hàng</span>
              </li>
              <li>
                <ThunderboltOutlined />
                <span>Tự động hóa quy trình check-in/check-out, giảm tải nhân sự</span>
              </li>
              <li>
                <SafetyOutlined />
                <span>Bảo mật dữ liệu và phân quyền chặt chẽ theo vai trò</span>
              </li>
            </ul>
          </div>
          <div className="benefits-cards">
            {benefitCards.map((item, index) => (
              <AnimatedBenefitCard key={item.title} item={item} index={index} />
            ))}
          </div>
        </div>
      </section>

      <section id="testimonials" className="testimonials-section">
        <div
          ref={testimonialsHeadingRef}
          className={`section-heading light ${testimonialsHeadingVisible ? 'animate-in' : ''}`}
        >
          <Tag color="darkgreen">Khách hàng nói gì?</Tag>
          <h2>Niềm tin từ hàng nghìn người dùng mỗi ngày</h2>
          <p>
            Các chủ bãi đỗ, doanh nghiệp và người lái xe trên khắp Việt Nam đang tăng trưởng cùng
            ParkSmart. Lắng nghe họ chia sẻ về trải nghiệm thực tế.
          </p>
        </div>

        <div className="testimonials-grid">
          {testimonials.map((item, index) => (
            <AnimatedTestimonialCard key={item.name} item={item} index={index} />
          ))}
        </div>
      </section>

      <footer className="landing-footer">
        <div className="footer-top">
          <div className="footer-left">
            <div className="footer-brand">
              <span className="brand-logo">P</span>
              <div>
                <h3>ParkSmart</h3>
                <p>
                  Đồng hành cùng hàng nghìn chủ bãi và tài xế trong hành trình đỗ xe thông minh.
                </p>
              </div>
            </div>
            <nav className="footer-nav">
              <a href="#booking">Trang chủ</a>
              <a href="#features">Tính năng</a>
              <a href="#benefits">Giải pháp</a>
              <a href="#testimonials">Khách hàng</a>
            </nav>
            <p className="footer-description">
              ParkSmart mang đến nền tảng đặt chỗ và quản lý bãi đỗ xe toàn diện. Từ sân bay, trung
              tâm thương mại đến khu dân cư, chúng tôi giúp tối ưu lưu lượng đỗ xe và gia tăng trải
              nghiệm khách hàng.
            </p>
          </div>

          <div className="footer-contact-card">
            <h4>Thông tin liên hệ</h4>
            <div className="contact-item">
              <EnvironmentOutlined />
              <span>44 Nguyễn Văn Cừ, Quận 1, TP. Hồ Chí Minh</span>
            </div>
            <div className="contact-item">
              <PhoneOutlined />
              <span>Hotline: (028) 3999 8888</span>
            </div>
            <div className="contact-item">
              <MailOutlined />
              <span>hello@parksmart.vn</span>
            </div>
          </div>
        </div>

        <div className="footer-separator" />

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} ParkSmart. All rights reserved.</span>
          <div className="footer-socials">
            <a aria-label="YouTube" href="#">
              <YoutubeOutlined />
            </a>
            <a aria-label="Instagram" href="#">
              <InstagramOutlined />
            </a>
            <a aria-label="Facebook" href="#">
              <FacebookFilled />
            </a>
            <a aria-label="LinkedIn" href="#">
              <LinkedinFilled />
            </a>
          </div>
          <div className="footer-links-inline">
            <a href="#">Chính sách bảo mật</a>
            <a href="#">Điều khoản sử dụng</a>
            <a href="#">Quy định hoàn tiền</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default HomePage
