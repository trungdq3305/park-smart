# Sử dụng base image Node.js
FROM node:20-alpine

# Thiết lập thư mục làm việc
WORKDIR /usr/src/app

# Copy package.json và yarn.lock để tận dụng cache của Docker
# ✅ Thay vì package*.json, chúng ta chỉ định rõ yarn.lock
COPY package.json yarn.lock* ./

# ✅ Thay "npm install" bằng "yarn install"
RUN yarn install --production

# ✅ Thay "npm install -g" bằng "yarn global add"
RUN yarn global add @nestjs/cli

# Copy toàn bộ source code
COPY . .

# Mở port 3000
EXPOSE 3000

# ✅ Giữ nguyên lệnh CMD vì đã cài Nest CLI global
CMD ["nest", "start"]