# ----- Giai đoạn 1: Build & Prune -----
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package.json yarn.lock* ./

# 1. Cài đặt TẤT CẢ dependencies để build
RUN yarn install

COPY . .

# 2. Build ứng dụng
RUN yarn build

# 3. Dọn dẹp: Xóa các devDependencies khỏi node_modules
# Lệnh này sẽ chỉ giữ lại các production dependencies
RUN yarn install --production

# ----- Giai đoạn 2: Production -----
FROM node:20-alpine

WORKDIR /usr/src/app

# Chỉ copy những thứ cần thiết cho production
COPY --from=builder /usr/src/app/package.json ./package.json
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules

EXPOSE 5000

CMD ["node", "dist/main"]