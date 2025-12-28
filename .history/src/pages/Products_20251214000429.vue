<template>
  <div
    class="products-page container-fluid"
      
    style="background: var(--color-body-bg); padding: var(--spacing-4);"
  >
    <div class="products-header">
      <div class="products-header__content">
        <div class="products-header__title-section">
          <h2 class="products-header__title">
            Quản lý Sản phẩm
          </h2>
          <p class="products-header__subtitle">
            Theo dõi trạng thái, giá và công thức sản phẩm với bố cục linh hoạt.
          </p>
        </div>
        <div class="products-header__actions">
          <div
            class="btn-group layout-toggle"
            role="group"
            aria-label="Chọn bố cục hiển thị"
          >
            <button
              type="button"
              class="btn btn-sm"
              :class="layoutMode === 'table' ? 'btn-primary' : 'btn-outline-primary'"
              @click="setLayout('table')"
            >
              <i class="bi bi-table me-2" />Bảng
            </button>
            <button
              type="button"
              class="btn btn-sm"
              :class="layoutMode === 'grid' ? 'btn-primary' : 'btn-outline-primary'"
              @click="setLayout('grid')"
            >
              <i class="bi bi-grid-3x3-gap me-2" />Thẻ
            </button>
          </div>
          <button
            class="btn btn-outline-primary btn-sm me-2"
            @click="showImportModal = true"
          >
            <i class="bi bi-upload me-2" />
            Nhập
          </button>
          <button
            class="btn btn-outline-primary btn-sm me-2"
            @click="showExportModal = true"
          >
            <i class="bi bi-download me-2" />
            Xuất
          </button>
          <button
            v-if="canCreate"
            class="btn btn-primary"
            type="button"
            style="height: 40px; padding: 12px 20px; font-family: var(--font-family-sans);"
            @click="openModal()"
          >
            <i
              class="bi bi-plus-lg"
              style="font-size: 18px; margin-right: 8px;"
            />
            Thêm sản phẩm
          </button>
        </div>
      </div>
    </div>

    <!-- Summary KPI Cards -->
    <div class="products-summary mb-4">
      <div class="row g-4">
        <div class="col-md-3 col-sm-6">
          <div class="kpi-card kpi-card--total">
            <div class="kpi-card__icon">
              <i class="bi bi-box-seam" />
            </div>
            <div class="kpi-card__content">
              <div class="kpi-card__label">
                Tổng sản phẩm:
              </div>
              <div class="kpi-card__value">
                {{ productStats.total }}
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3 col-sm-6">
          <div class="kpi-card kpi-card--active">
            <div class="kpi-card__icon">
              <i class="bi bi-check-circle" />
            </div>
            <div class="kpi-card__content">
              <div class="kpi-card__label">
                Đang kinh doanh:
              </div>
              <div class="kpi-card__value">
                {{ productStats.active }}
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3 col-sm-6">
          <div class="kpi-card kpi-card--inactive">
            <div class="kpi-card__icon">
              <i class="bi bi-pause-circle" />
            </div>
            <div class="kpi-card__content">
              <div class="kpi-card__label">
                Ngừng bán:
              </div>
              <div class="kpi-card__value">
                {{ productStats.inactive }}
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3 col-sm-6">
          <div class="kpi-card kpi-card--categories">
            <div class="kpi-card__icon">
              <i class="bi bi-tags" />
            </div>
            <div class="kpi-card__content">
              <div class="kpi-card__label">
                Danh mục đang dùng:
              </div>
              <div class="kpi-card__value">
                {{ productStats.categories }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card filter-card mb-4">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h5 class="mb-0">
            Bộ lọc
          </h5>
          <button
            class="btn btn-sm btn-outline-secondary"
            type="button"
            @click="toggleAdvancedFilters"
          >
            <i
              class="bi"
              :class="showAdvancedFilters ? 'bi-chevron-up' : 'bi-chevron-down'"
            />
            {{ showAdvancedFilters ? 'Ẩn' : 'Hiện' }} bộ lọc nâng cao
          </button>
        </div>
        <div class="row g-3 align-items-end">
          <div class="col-lg-4 col-md-6">
            <label class="form-label">Tìm theo tên</label>
            <div class="input-group search-field">
              <span class="input-group-text"><i class="bi bi-search" /></span>
              <input
                v-model="filters.name"
                type="text"
                class="form-control"
                placeholder="Nhập tên sản phẩm"
                @input="handleSearchInput"
              >
            </div>
          </div>
          <div class="col-lg-3 col-md-6">
            <label class="form-label">Danh mục</label>
            <select
              v-model="filters.categoryId"
              class="form-select"
            >
              <option :value="null">
                Tất cả danh mục
              </option>
              <option
                v-for="category in categories"
                :key="category.id"
                :value="category.id"
              >
                {{ category.name }}
              </option>
            </select>
          </div>
          <div class="col-lg-3 col-md-6">
            <label class="form-label">Trạng thái</label>
            <select
              v-model="filters.available"
              class="form-select"
            >
              <option :value="null">
                Tất cả
              </option>
              <option :value="true">
                Đang kinh doanh
              </option>
              <option :value="false">
                Ngừng bán
              </option>
            </select>
          </div>
          <div class="col-lg-2 col-md-6">
            <label class="form-label">Sắp xếp</label>
            <select
              v-model="sortState"
              class="form-select"
            >
              <option value="">
                Mặc định
              </option>
              <option value="name-asc">
                Tên A → Z
              </option>
              <option value="name-desc">
                Tên Z → A
              </option>
              <option value="price-asc">
                Giá tăng dần
              </option>
              <option value="price-desc">
                Giá giảm dần
              </option>
              <option value="bestseller">
                Bán chạy nhất
              </option>
            </select>
          </div>
        </div>
        <div
          v-if="showAdvancedFilters"
          class="row g-3 align-items-end mt-3 pt-3 border-top"
        >
          <div class="col-lg-3 col-md-6">
            <label class="form-label">Giá từ (₫)</label>
            <input
              v-model.number="filters.priceMin"
              type="number"
              class="form-control"
              placeholder="0"
              min="0"
              step="1000"
            >
          </div>
          <div class="col-lg-3 col-md-6">
            <label class="form-label">Giá đến (₫)</label>
            <input
              v-model.number="filters.priceMax"
              type="number"
              class="form-control"
              placeholder="Không giới hạn"
              min="0"
              step="1000"
            >
          </div>
          <div class="col-lg-3 col-md-6">
            <label class="form-label">Bán chạy</label>
            <select
              v-model="filters.bestseller"
              class="form-select"
            >
              <option :value="null">
                Tất cả
              </option>
              <option :value="true">
                Chỉ sản phẩm bán chạy
              </option>
              <option :value="false">
                Không phải bán chạy
              </option>
            </select>
          </div>
          <div class="col-lg-3 col-md-6">
            <button
              class="btn btn-outline-secondary w-100"
              type="button"
              @click="resetFilters"
            >
              <i class="bi bi-arrow-counterclockwise me-2" />Thiết lập lại
            </button>
          </div>
        </div>
        <div
          v-else
          class="row g-3 align-items-end mt-3"
        >
          <div class="col-12 text-end">
            <button
              class="btn btn-outline-secondary"
              type="button"
              @click="resetFilters"
            >
              <i class="bi bi-arrow-counterclockwise me-2" />Thiết lập lại
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="card tabs-card">
      <div class="card-body">
        <div
          class="btn-group layout-toggle mb-4"
          role="group"
          aria-label="Chọn bố cục hiển thị"
        >
          <button
            type="button"
            class="btn btn-sm"
            :class="isTableLayout ? 'btn-primary' : 'btn-outline-primary'"
            @click="setLayout('table')"
          >
            <i class="bi bi-table me-2" />Bảng
          </button>
          <button
            type="button"
            class="btn btn-sm"
            :class="!isTableLayout ? 'btn-primary' : 'btn-outline-primary'"
            @click="setLayout('grid')"
          >
            <i class="bi bi-grid-3x3-gap me-2" />Thẻ
          </button>
        </div>

        <LoadingState v-if="loading" />
        <ErrorState
          v-else-if="error"
          :message="error"
          @retry="fetchProducts"
        />
        <EmptyState
          v-else-if="!products.length"
          title="Chưa có sản phẩm"
          message="Hãy thêm sản phẩm đầu tiên để bắt đầu quản lý."
        />
        <div v-else>
          <!-- Virtual Table for large lists -->
          <VirtualTable
            v-if="isTableLayout && useVirtualScroll && products.length > virtualScrollThreshold"
            :items="products"
            :item-height="70"
            :container-height="600"
            :overscan="5"
            :get-item-key="(item) => item.id"
          >
            <template #header>
              <th style="width: 50px;">
                <input
                  type="checkbox"
                  :checked="bulkActions.isSelectAll && products.length > 0"
                  :indeterminate="bulkActions.selectedCount > 0 && !bulkActions.isSelectAll"
                  @change="handleSelectAll"
                >
              </th>
              <th style="width: 80px;">
                Ảnh
              </th>
              <th style="min-width: 200px;">
                Tên sản phẩm
              </th>
              <th style="width: 100px;">
                Mã
              </th>
              <th
                class="text-end"
                style="width: 120px;"
              >
                Giá bán
              </th>
              <th style="width: 150px;">
                Danh mục
              </th>
              <th style="width: 120px;">
                Trạng thái
              </th>
              <th
                class="text-center"
                style="width: 140px;"
              >
                Hành động
              </th>
            </template>
            <template #row="{ item: product }">
              <td>
                <input
                  type="checkbox"
                  :checked="bulkActions.isSelected(product.id)"
                  @change="bulkActions.toggleSelection(product.id)"
                >
              </td>
              <td>
                <LazyImage
                  :src="product.imageUrl || '/placeholder.png'"
                  alt="Ảnh sản phẩm"
                  aspect-ratio="1/1"
                  class="product-thumb product-thumb--clickable"
                  @click="openDetailModal(product)"
                />
              </td>
              <td class="fw-semibold product-name--clickable">
                <span @click="openDetailModal(product)">{{ product.name }}</span>
              </td>
              <td>{{ product.code }}</td>
              <td class="text-end fw-semibold">
                {{ formatCurrency(product.price) }}
              </td>
              <td>{{ product.categoryName }}</td>
              <td>
                <span
                  class="badge badge-status"
                  :class="product.available ? 'badge-status--success' : 'badge-status--default'"
                >
                  {{ product.available ? 'Kinh doanh' : 'Ngừng bán' }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <!-- Nút Chỉnh sửa chính -->
                  <button
                    v-if="canEdit"
                    class="action-button action-button--primary action-button--icon-only"
                    type="button"
                    title="Chỉnh sửa"
                    @click.stop="openModal(product)"
                  >
                    <i class="bi bi-pencil" />
                  </button>
                  <!-- Menu dropdown cho các hành động khác -->
                  <div class="dropdown action-dropdown">
                    <button
                      :id="`action-menu-${product.id}`"
                      class="action-button action-button--secondary action-button--icon-only"
                      type="button"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                      title="Thêm hành động"
                      @click.stop
                    >
                      <i class="bi bi-three-dots-vertical" />
                    </button>
                    <ul
                      class="dropdown-menu dropdown-menu-end"
                      :aria-labelledby="`action-menu-${product.id}`"
                    >
                      <li>
                        <button
                          class="dropdown-item"
                          type="button"
                          @click="openDetailModal(product)"
                        >
                          <i class="bi bi-eye me-2" />
                          Xem chi tiết
                        </button>
                      </li>
                      <li v-if="canToggle">
                        <hr class="dropdown-divider">
                        <button
                          class="dropdown-item"
                          type="button"
                          :disabled="isToggling(product.id)"
                          @click="openToggleModal(product)"
                        >
                          <span
                            v-if="isToggling(product.id)"
                            class="spinner-border spinner-border-sm me-2"
                          />
                          <i
                            v-else
                            :class="product.available ? 'bi bi-pause-circle me-2' : 'bi bi-play-circle me-2'"
                          />
                          {{ product.available ? 'Tạm ngưng' : 'Kích hoạt' }}
                        </button>
                      </li>
                      <li v-if="canDelete">
                        <hr class="dropdown-divider">
                        <button
                          class="dropdown-item dropdown-item--danger"
                          type="button"
                          @click="openDeleteModal(product)"
                        >
                          <i class="bi bi-trash me-2" />
                          Xóa
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
              </td>
            </template>
          </VirtualTable>

          <!-- Regular Table for small lists -->
          <div
            v-else-if="isTableLayout"
            class="table-responsive table-wrapper"
          >
            <table class="table align-middle table-hover table-sticky-header">
              <thead>
                <tr>
                  <th style="width: 50px;">
                    <input
                      type="checkbox"
                      :checked="bulkActions.isSelectAll && products.length > 0"
                      :indeterminate="bulkActions.selectedCount > 0 && !bulkActions.isSelectAll"
                      @change="handleSelectAll"
                    >
                  </th>
                  <th style="width: 80px;">
                    Ảnh
                  </th>
                  <th style="min-width: 200px;">
                    Tên sản phẩm
                  </th>
                  <th style="width: 100px;">
                    Mã
                  </th>
                  <th
                    class="text-end"
                    style="width: 120px;"
                  >
                    Giá bán
                  </th>
                  <th style="width: 150px;">
                    Danh mục
                  </th>
                  <th style="width: 120px;">
                    Trạng thái
                  </th>
                  <th
                    class="text-center"
                    style="width: 140px;"
                  >
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="product in products"
                  :key="product.id"
                >
                  <td>
                    <input
                      type="checkbox"
                      :checked="bulkActions.isSelected(product.id)"
                      @change="bulkActions.toggleSelection(product.id)"
                    >
                  </td>
                  <td>
                    <img
                      :src="product.imageUrl || '/placeholder.png'"
                      alt="Ảnh sản phẩm"
                      class="product-thumb product-thumb--clickable"
                      @click="openDetailModal(product)"
                    >
                  </td>
                  <td class="fw-semibold product-name--clickable">
                    <span @click="openDetailModal(product)">{{ product.name }}</span>
                  </td>
                  <td>{{ product.code }}</td>
                  <td class="text-end fw-semibold">
                    {{ formatCurrency(product.price) }}
                  </td>
                  <td>{{ product.categoryName }}</td>
                  <td>
                    <span
                      class="badge badge-status"
                      :class="product.available ? 'badge-status--success' : 'badge-status--default'"
                    >
                      {{ product.available ? 'Kinh doanh' : 'Ngừng bán' }}
                    </span>
                  </td>
                  <td>
                    <div class="action-buttons">
                      <!-- Nút Chỉnh sửa chính -->
                      <button
                        v-if="canEdit"
                        class="action-button action-button--primary action-button--icon-only"
                        type="button"
                        title="Chỉnh sửa"
                        @click.stop="openModal(product)"
                      >
                        <i class="bi bi-pencil" />
                      </button>
                      <!-- Menu dropdown cho các hành động khác -->
                      <div class="dropdown action-dropdown">
                        <button
                          :id="`action-menu-${product.id}`"
                          class="action-button action-button--secondary action-button--icon-only"
                          type="button"
                          data-bs-toggle="dropdown"
                          aria-expanded="false"
                          title="Thêm hành động"
                          @click.stop
                        >
                          <i class="bi bi-three-dots-vertical" />
                        </button>
                        <ul
                          class="dropdown-menu dropdown-menu-end"
                          :aria-labelledby="`action-menu-${product.id}`"
                        >
                          <li>
                            <button
                              class="dropdown-item"
                              type="button"
                              @click="openDetailModal(product)"
                            >
                              <i class="bi bi-eye me-2" />
                              Xem chi tiết
                            </button>
                          </li>
                          <li v-if="canToggle">
                            <hr class="dropdown-divider">
                            <button
                              class="dropdown-item"
                              type="button"
                              :disabled="isToggling(product.id)"
                              @click="openToggleModal(product)"
                            >
                              <span
                                v-if="isToggling(product.id)"
                                class="spinner-border spinner-border-sm me-2"
                              />
                              <i
                                v-else
                                :class="product.available ? 'bi bi-pause-circle me-2' : 'bi bi-play-circle me-2'"
                              />
                              {{ product.available ? 'Tạm ngưng' : 'Kích hoạt' }}
                            </button>
                          </li>
                          <li v-if="canDelete">
                            <hr class="dropdown-divider">
                            <button
                              class="dropdown-item dropdown-item--danger"
                              type="button"
                              @click="openDeleteModal(product)"
                            >
                              <i class="bi bi-trash me-2" />
                              Xóa
                            </button>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Virtual Grid for large lists -->
          <VirtualGrid
            v-else-if="useVirtualScroll && products.length > virtualScrollThreshold"
            :items="products"
            :item-height="320"
            :item-width="280"
            :columns="getGridColumns"
            :container-height="600"
            :gap="20"
            :get-item-key="(item) => item.id"
          >
            <template #default="{ item: product }">
              <article
                class="product-card"
                @click.stop="openDetailModal(product)"
              >
                <div class="product-card__media">
                  <LazyImage
                    :src="product.imageUrl || '/placeholder.png'"
                    alt="Ảnh sản phẩm"
                    aspect-ratio="16/9"
                  />
                  <span
                    class="badge badge-status"
                    :class="product.available ? 'badge-status--success' : 'badge-status--default'"
                  >
                    {{ product.available ? 'Kinh doanh' : 'Ngừng bán' }}
                  </span>
                </div>
                <div class="product-card__body">
                  <h5 class="product-card__title">
                    {{ product.name }}
                  </h5>
                  <div class="product-card__meta">
                    <span><i class="bi bi-tag me-1" />{{ product.code }}</span>
                    <span><i class="bi bi-box-seam me-1" />{{ product.categoryName }}</span>
                  </div>
                  <div class="product-card__price">
                    <span class="label">Giá bán</span>
                    <span class="value">{{ formatCurrency(product.price) }}</span>
                  </div>
                </div>
                <div
                  class="product-card__actions"
                  @click.stop
                >
                  <!-- 1. Xem chi tiết -->
                  <button
                    class="action-button action-button--info"
                    type="button"
                    title="Xem chi tiết"
                    @click="openDetailModal(product)"
                  >
                    <i class="bi bi-eye" />
                    <span>Chi tiết</span>
                  </button>
                  <!-- 2. Chỉnh sửa -->
                  <button
                    v-if="canEdit"
                    class="action-button action-button--primary"
                    type="button"
                    title="Chỉnh sửa"
                    @click="openModal(product)"
                  >
                    <i class="bi bi-pencil" />
                    <span>Chỉnh sửa</span>
                  </button>
                  <!-- 3. Bật/Tắt -->
                  <button
                    v-if="canToggle"
                    class="action-button action-button--warning"
                    type="button"
                    :title="product.available ? 'Tạm ngưng' : 'Kích hoạt'"
                    :disabled="isToggling(product.id)"
                    @click="openToggleModal(product)"
                  >
                    <span
                      v-if="isToggling(product.id)"
                      class="spinner-border spinner-border-sm"
                    />
                    <template v-else>
                      <i :class="product.available ? 'bi bi-pause-circle' : 'bi bi-play-circle'" />
                      <span>{{ product.available ? 'Tạm ngưng' : 'Kích hoạt' }}</span>
                    </template>
                  </button>
                  <!-- 5. Xóa -->
                  <button
                    v-if="canDelete"
                    class="action-button action-button--danger"
                    type="button"
                    title="Xóa sản phẩm"
                    @click="openDeleteModal(product)"
                  >
                    <i class="bi bi-trash" />
                    <span>Xóa</span>
                  </button>
                </div>
              </article>
            </template>
          </VirtualGrid>

          <!-- Regular Grid for small lists -->
          <div
            v-else
            class="product-grid"
          >
            <article
              v-for="product in products"
              :key="product.id"
              class="product-card"
              @click.stop="openDetailModal(product)"
            >
              <div class="product-card__media">
                <LazyImage
                  :src="product.imageUrl || '/placeholder.png'"
                  alt="Ảnh sản phẩm"
                  aspect-ratio="16/9"
                />
                <span
                  class="badge badge-status"
                  :class="product.available ? 'badge-status--success' : 'badge-status--default'"
                >
                  {{ product.available ? 'Kinh doanh' : 'Ngừng bán' }}
                </span>
              </div>
              <div class="product-card__body">
                <h5 class="product-card__title">
                  {{ product.name }}
                </h5>
                <div class="product-card__meta">
                  <span><i class="bi bi-tag me-1" />{{ product.code }}</span>
                  <span><i class="bi bi-box-seam me-1" />{{ product.categoryName }}</span>
                </div>
                <div class="product-card__price">
                  <span class="label">Giá bán</span>
                  <span class="value">{{ formatCurrency(product.price) }}</span>
                </div>
              </div>
              <div
                class="product-card__actions"
                @click.stop
              >
                <!-- 1. Xem chi tiết -->
                <button
                  class="action-button action-button--info"
                  type="button"
                  title="Xem chi tiết"
                  @click="openDetailModal(product)"
                >
                  <i class="bi bi-eye" />
                  <span>Chi tiết</span>
                </button>
                <!-- 2. Chỉnh sửa -->
                <button
                  v-if="canEdit"
                  class="action-button action-button--primary"
                  type="button"
                  title="Chỉnh sửa"
                  @click="openModal(product)"
                >
                  <i class="bi bi-pencil" />
                  <span>Chỉnh sửa</span>
                </button>
                <!-- 3. Bật/Tắt -->
                <button
                  v-if="canToggle"
                  class="action-button action-button--warning"
                  type="button"
                  :title="product.available ? 'Tạm ngưng' : 'Kích hoạt'"
                  :disabled="isToggling(product.id)"
                  @click="openToggleModal(product)"
                >
                  <span
                    v-if="isToggling(product.id)"
                    class="spinner-border spinner-border-sm"
                  />
                  <template v-else>
                    <i :class="product.available ? 'bi bi-pause-circle' : 'bi bi-play-circle'" />
                    <span>{{ product.available ? 'Tạm ngưng' : 'Kích hoạt' }}</span>
                  </template>
                </button>
                <!-- 5. Xóa -->
                <button
                  v-if="canDelete"
                  class="action-button action-button--danger"
                  type="button"
                  title="Xóa sản phẩm"
                  @click="openDeleteModal(product)"
                >
                  <i class="bi bi-trash" />
                  <span>Xóa</span>
                </button>
              </div>
            </article>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination và PageSize Selector -->
    <div
      v-if="totalPages > 1 || pageSize"
      class="d-flex justify-content-between align-items-center mt-3"
      style="margin-bottom: 80px;"
    >
      <!-- Page Size Selector -->
      <div
        v-if="pageSize"
        class="d-flex align-items-center gap-2"
      >
        <label
          class="mb-0 text-muted small"
          style="font-family: var(--font-family-sans);"
        >
          Hiển thị:
        </label>
        <select
          :value="pageSize"
          class="form-select form-select-sm"
          style="width: auto; min-width: 80px; font-family: var(--font-family-sans);"
          @change="handlePageSizeChange(parseInt($event.target.value, 10))"
        >
          <option :value="10">
            10
          </option>
          <option :value="20">
            20
          </option>
          <option :value="30">
            30
          </option>
          <option :value="50">
            50
          </option>
        </select>
        <span
          class="text-muted small"
          style="font-family: var(--font-family-sans);"
        >
          / trang
        </span>
      </div>
      <div v-else />
      <!-- Pagination -->
      <div
        v-if="totalPages > 1"
        class="d-flex justify-content-center"
        style="flex: 1;"
      >
        <Pagination
          mode="zero-based"
          :total-pages="totalPages"
          :current-page="zeroBasedPage"
          @page-change="handlePageChange"
        />
      </div>
    </div>

    <ProductModal
      ref="productModal"
      :product="selectedProduct"
      :categories="categories"
      @saved="handleProductSaved"
    />

    <ProductDetailModal
      ref="productDetailModal"
      :product="detailProduct"
    />

    <ProductRecipeModal
      ref="productRecipeModal"
      :product="selectedProduct"
      @saved="handleRecipeSaved"
    />

    <!-- Delete Product Modal -->
    <Teleport to="body">
      <div
        ref="deleteModalRef"
        class="modal fade"
        tabindex="-1"
        aria-labelledby="deleteProductModalLabel"
        aria-hidden="true"
      >
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
          <div class="modal-content">
            <div class="modal-header">
              <div class="modal-header__content">
                <h5
                  id="deleteProductModalLabel"
                  class="modal-title"
                >
                  Xóa sản phẩm
                </h5>
                <p class="modal-subtitle mb-0">
                  Hành động này không thể hoàn tác.
                </p>
              </div>
              <button
                type="button"
                class="btn-close"
                aria-label="Đóng"
                @click="closeDeleteModal"
              />
            </div>
            <div class="modal-body">
              <div
                v-if="deletingProduct"
                class="alert alert-info mb-3"
              >
                <span class="spinner-border spinner-border-sm me-2" />
                Đang xóa sản phẩm...
              </div>
              <p class="mb-3">
                Bạn có chắc chắn muốn xóa sản phẩm này không?
              </p>
              <div class="alert alert-warning mb-3">
                <i class="bi bi-exclamation-triangle me-2" />
                <strong>Lưu ý:</strong> Không thể xóa sản phẩm đã có trong đơn hàng. Nếu sản phẩm đã được sử dụng, vui lòng sử dụng chức năng "Ngừng bán" thay vì xóa.
              </div>
              <div class="delete-info-card">
                <div class="delete-info-item">
                  <span class="delete-info-label">Tên sản phẩm:</span>
                  <span class="delete-info-value">{{ deleteTarget?.name || '—' }}</span>
                </div>
                <div class="delete-info-item">
                  <span class="delete-info-label">Mã sản phẩm:</span>
                  <span class="delete-info-value">{{ deleteTarget?.code || '—' }}</span>
                </div>
                <div
                  v-if="deleteTarget?.available !== undefined"
                  class="delete-info-item"
                >
                  <span class="delete-info-label">Trạng thái:</span>
                  <span
                    class="delete-info-value"
                    :class="deleteTarget.available ? 'text-success' : 'text-muted'"
                  >
                    {{ deleteTarget.available ? 'Đang bán' : 'Ngừng bán' }}
                  </span>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-outline-secondary"
                :disabled="deletingProduct"
                @click="closeDeleteModal"
              >
                Hủy
              </button>
              <button
                type="button"
                class="btn btn-danger"
                :disabled="deletingProduct"
                @click="handleDeleteClick"
              >
                <span
                  v-if="deletingProduct"
                  class="spinner-border spinner-border-sm me-2"
                />
                <i
                  v-else
                  class="bi bi-trash me-2"
                />
                Xóa sản phẩm
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Toggle Availability Modal -->
    <Teleport to="body">
      <div
        ref="toggleModalRef"
        class="modal fade"
        tabindex="-1"
        aria-hidden="true"
      >
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <div class="modal-header__content">
                <h5 class="modal-title">
                  Thay đổi trạng thái sản phẩm
                </h5>
                <p class="modal-subtitle mb-0">
                  Xác nhận chuyển trạng thái kinh doanh cho sản phẩm này.
                </p>
              </div>
              <button
                type="button"
                class="btn-close"
                data-bs-dismiss="modal"
                aria-label="Đóng"
              />
            </div>
            <div class="modal-body">
              <p class="mb-3">
                Bạn có chắc chắn muốn
                <strong>{{ toggleTarget?.available ? 'ngừng bán' : 'mở bán lại' }}</strong>
                sản phẩm <strong>{{ toggleTarget?.name }}</strong>?
              </p>
              <div
                v-if="toggleTarget"
                class="confirm-card"
              >
                <div class="confirm-item">
                  <span class="confirm-label">Mã sản phẩm</span>
                  <span class="confirm-value">{{ toggleTarget.code }}</span>
                </div>
                <div class="confirm-item">
                  <span class="confirm-label">Trạng thái hiện tại</span>
                  <span class="confirm-value">
                    {{ toggleTarget.available ? 'Đang kinh doanh' : 'Ngừng bán' }}
                  </span>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-outline-secondary"
                data-bs-dismiss="modal"
              >
                Hủy
              </button>
              <button
                type="button"
                class="btn btn-primary"
                :disabled="toggleTarget && isToggling(toggleTarget.id)"
                @click="handleToggleConfirm"
              >
                <span
                  v-if="toggleTarget && isToggling(toggleTarget.id)"
                  class="spinner-border spinner-border-sm me-2"
                />
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>


    <!-- Bulk Actions Bar -->
    <BulkActionsBar
      :selected-count="bulkActions.selectedCount.value"
      :has-selection="bulkActions.hasSelection.value"
      :is-processing="bulkActions.isProcessing.value"
      :progress-percentage="progressPercentage"
      :actions="bulkActionItems"
      item-label="sản phẩm"
      @action="handleBulkAction"
      @clear="bulkActions.clearSelection"
    />

    <!-- Export Modal -->
    <ExportModal
      :show="showExportModal"
      :data="products"
      :columns="exportColumns"
      :has-filters="hasActiveFilters"
      default-filename="products"
      @close="showExportModal = false"
      @export="handleExport"
    />

    <!-- Import Modal -->
    <ImportModal
      :show="showImportModal"
      :required-fields="importRequiredFields"
      :validation-rules="importValidationRules"
      :on-import="handleImport"
      @close="showImportModal = false"
      @import="handleImportComplete"
    />
  </div>
</template>

<script setup>
// Vue core
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'

// Third-party
import { toast } from 'vue3-toastify'
import { storeToRefs } from 'pinia'
import { Modal } from 'bootstrap'

// API services
import * as productService from '@/api/productService'
import * as categoryService from '@/api/categoryService'
import * as reportService from '@/api/reportService'

// Utils
import { formatCurrency } from '@/utils/formatters'
import logger from '@/utils/logger'

// Composables
import { useTableData } from '@/composables/useTableData'
import { useAuthStore } from '@/store/auth'
import { useAsyncOperation } from '@/composables/useAsyncOperation'
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'
import { useBulkActions } from '@/composables/useBulkActions'

// Components - Common
import Pagination from '@/components/common/Pagination.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import VirtualTable from '@/components/common/VirtualTable.vue'
import VirtualGrid from '@/components/common/VirtualGrid.vue'
import LazyImage from '@/components/common/LazyImage.vue'

// Components - Products
import ProductModal from '@/components/products/ProductModal.vue'
import ProductDetailModal from '@/components/products/ProductDetailModal.vue'
import ProductRecipeModal from '@/components/products/ProductRecipeModal.vue'

// Components - Other
import BulkActionsBar from '@/components/BulkActionsBar.vue'
import ExportModal from '@/components/ExportModal.vue'
import ImportModal from '@/components/ImportModal.vue'

const authStore = useAuthStore()
const { isAdmin, isManager, isStaff } = storeToRefs(authStore)

// Permission checks
const canCreate = computed(() => isAdmin.value || isManager.value || isStaff.value)
const canEdit = computed(() => isAdmin.value || isManager.value || isStaff.value)
const canToggle = computed(() => isAdmin.value || isManager.value || isStaff.value)
const canDelete = computed(() => isAdmin.value || isManager.value) // Only Admin and Manager can delete

const { loading, error, execute } = useAsyncOperation({ context: 'Products' })

const allProducts = ref([]) // Tất cả products từ API
const categories = ref([])
const selectedProduct = ref(null)
const detailProduct = ref(null)
const productModal = ref(null)
const productDetailModal = ref(null)
const productRecipeModal = ref(null)
const layoutMode = ref('table')
const togglingAvailability = reactive({})

// Virtual scrolling configuration
const useVirtualScroll = ref(true) // Enable virtual scrolling
const virtualScrollThreshold = 100 // Use virtual scroll when items > 100

// Grid columns based on screen size
const getGridColumns = computed(() => {
    if (typeof window === 'undefined') return 4
    const width = window.innerWidth
    if (width < 768) return 1
    if (width < 1024) return 2
    if (width < 1440) return 3
    return 4
})
const productStats = ref({
    total: 0,
    active: 0,
    inactive: 0,
    categories: 0
})
const deleteTarget = ref(null)
const deleteModalRef = ref(null)
const deletingProduct = ref(false)
let deleteModalInstance = null

const toggleTarget = ref(null)
const toggleModalRef = ref(null)
let toggleModalInstance = null

// Bestseller data
const bestsellerProductIds = ref(new Set())
const bestsellerData = ref({}) // Map productId -> sales data

// Bulk Actions
const bulkActions = useBulkActions({
    onBulkAction: (action, selectedIds, results) => {
        logger.log('[Products] Thao tác hàng loạt hoàn tất', { action, selectedIds, results })
        if (results.success > 0) {
            toast.success(`${results.success} sản phẩm đã được ${action} thành công`)
        }
        if (results.failed > 0) {
            toast.error(`${results.failed} sản phẩm ${action} thất bại`)
        }
        // Làm mới danh sách sản phẩm
        fetchProducts()
    },
    maxBatchSize: 100
})

const showExportModal = ref(false)
const showImportModal = ref(false)
const progressPercentage = ref(0)

// Bulk action items
const bulkActionItems = computed(() => {
    const items = [
        {
            id: 'export',
            label: 'Xuất',
            icon: 'bi bi-download',
            confirm: false
        },
        {
            id: 'activate',
            label: 'Kích hoạt',
            icon: 'bi bi-check-circle',
            confirm: true,
            confirmMessage: 'Bạn có chắc chắn muốn kích hoạt các sản phẩm đã chọn?'
        },
        {
            id: 'deactivate',
            label: 'Vô hiệu hóa',
            icon: 'bi bi-pause-circle',
            confirm: true,
            confirmMessage: 'Bạn có chắc chắn muốn vô hiệu hóa các sản phẩm đã chọn?'
        }
    ]

    if (canDelete.value) {
        items.unshift({
            id: 'delete',
            label: 'Xóa',
            icon: 'bi bi-trash',
            danger: true,
            confirm: true,
            confirmMessage: 'Bạn có chắc chắn muốn xóa các sản phẩm đã chọn? Hành động này không thể hoàn tác.'
        })
    }

    return items
})

// Export columns
const exportColumns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Tên sản phẩm' },
    { key: 'code', label: 'Mã sản phẩm' },
    {
        key: 'price',
        label: 'Giá bán',
        value: (item) => formatCurrency(item.price)
    },
    { key: 'categoryName', label: 'Danh mục' },
    {
        key: 'available',
        label: 'Trạng thái',
        value: (item) => item.available ? 'Kinh doanh' : 'Ngừng bán'
    },
    { key: 'description', label: 'Mô tả' }
]

// Import fields
const importRequiredFields = [
    { key: 'name', label: 'Tên sản phẩm', required: true },
    { key: 'price', label: 'Giá bán', required: true },
    { key: 'categoryId', label: 'ID Danh mục', required: true }
]

const importValidationRules = [
    {
        field: 'name',
        label: 'Tên sản phẩm',
        required: true,
        type: 'string',
        validator: (value) => {
            if (!value || value.trim().length === 0) {
                return 'Tên sản phẩm không được để trống'
            }
            if (value.length > 150) {
                return 'Tên sản phẩm không được vượt quá 150 ký tự'
            }
            return true
        }
    },
    {
        field: 'price',
        label: 'Giá bán',
        required: true,
        type: 'number',
        validator: (value) => {
            const num = Number(value)
            if (isNaN(num) || num <= 0) {
                return 'Giá bán phải là số lớn hơn 0'
            }
            return true
        }
    },
    {
        field: 'categoryId',
        label: 'ID Danh mục',
        required: true,
        type: 'number',
        validator: (value) => {
            const num = Number(value)
            if (isNaN(num) || num <= 0) {
                return 'ID Danh mục phải là số hợp lệ'
            }
            return true
        }
    }
]

// Check if has active filters
const hasActiveFilters = computed(() => filters.name ||
           filters.categoryId ||
           filters.available !== null ||
           filters.priceMin ||
           filters.priceMax ||
           filters.bestseller !== null)

// Xử lý thao tác hàng loạt
const handleBulkAction = async (action) => {
    try {
        switch (action.id) {
            case 'delete':
                if (bulkActions.selectedCount === 0) {
                    toast.warning('Vui lòng chọn ít nhất một sản phẩm')
                    return
                }
                await bulkActions.executeBulkAction(
                    'delete',
                    async (id) => {
                        await productService.deleteProduct(id)
                    },
                    {
                        confirm: false,
                        skipConfirm: true,
                        onProgress: (progress) => {
                            progressPercentage.value = progress.percentage
                        },
                        clearOnSuccess: true,
                        onComplete: (results) => {
                            progressPercentage.value = 0
                            if (results.success > 0) {
                                toast.success(`Đã xóa ${results.success} sản phẩm thành công`)
                            }
                            if (results.failed > 0) {
                                toast.error(`${results.failed} sản phẩm xóa thất bại`)
                            }
                        }
                    }
                )
                break

            case 'export':
                showExportModal.value = true
                break

            case 'activate':
                if (bulkActions.selectedCount === 0) {
                    toast.warning('Vui lòng chọn ít nhất một sản phẩm')
                    return
                }
                await bulkActions.executeBulkAction(
                    'activate',
                    async (id) => {
                        await productService.updateProduct(id, { available: true })
                    },
                    {
                        confirm: false,
                        skipConfirm: true,
                        clearOnSuccess: true,
                        onProgress: (progress) => {
                            progressPercentage.value = progress.percentage
                        },
                        onComplete: (results) => {
                            progressPercentage.value = 0
                            if (results.success > 0) {
                                toast.success(`Đã kích hoạt ${results.success} sản phẩm thành công`)
                            }
                            if (results.failed > 0) {
                                toast.error(`${results.failed} sản phẩm kích hoạt thất bại`)
                            }
                        }
                    }
                )
                break

            case 'deactivate':
                if (bulkActions.selectedCount === 0) {
                    toast.warning('Vui lòng chọn ít nhất một sản phẩm')
                    return
                }
                await bulkActions.executeBulkAction(
                    'deactivate',
                    async (id) => {
                        await productService.updateProduct(id, { available: false })
                    },
                    {
                        confirm: false,
                        skipConfirm: true,
                        clearOnSuccess: true,
                        onProgress: (progress) => {
                            progressPercentage.value = progress.percentage
                        },
                        onComplete: (results) => {
                            progressPercentage.value = 0
                            if (results.success > 0) {
                                toast.success(`Đã vô hiệu hóa ${results.success} sản phẩm thành công`)
                            }
                            if (results.failed > 0) {
                                toast.error(`${results.failed} sản phẩm vô hiệu hóa thất bại`)
                            }
                        }
                    }
                )
                break
        }
    } catch (err) {
        logger.error('[Products] Lỗi khi thực hiện thao tác hàng loạt:', err)
        toast.error(`Có lỗi xảy ra: ${  err.message || 'Lỗi không xác định'}`)
        progressPercentage.value = 0
    }
}

// Xử lý chọn tất cả
const handleSelectAll = () => {
    if (bulkActions.isSelectAll) {
        bulkActions.clearSelection()
    } else {
        bulkActions.selectAll(products.value)
    }
}

// Xử lý xuất dữ liệu
const handleExport = (result) => {
    toast.success(`Đã xuất ${result.rowCount} sản phẩm thành công`)
}

// Xử lý nhập dữ liệu
const handleImport = async (mappedData) => {
    const results = await Promise.allSettled(
        mappedData.map(item => productService.createProduct(item))
    )

    const successCount = results.filter(r => r.status === 'fulfilled').length
    const failedCount = results.filter(r => r.status === 'rejected').length

    if (successCount > 0) {
        toast.success(`Đã nhập ${successCount} sản phẩm thành công`)
    }
    if (failedCount > 0) {
        toast.error(`${failedCount} sản phẩm nhập thất bại`)
    }

    return {
        success: successCount,
        failed: failedCount
    }
}

// Xử lý hoàn thành nhập dữ liệu
const handleImportComplete = (result) => {
    logger.log('[Products] Nhập dữ liệu hoàn tất', result)
    // Làm mới danh sách sản phẩm
    fetchProducts()
}

const debounce = (fn, delay = 300) => {
    let timeoutId
    return (...args) => {
        if (timeoutId) {
            window.clearTimeout(timeoutId)
        }
        timeoutId = window.setTimeout(() => {
            fn(...args)
        }, delay)
    }
}

const filters = reactive({
    name: '',
    categoryId: null,
    available: null,
    priceMin: null,
    priceMax: null,
    bestseller: null
})

const sortState = ref('')
const showAdvancedFilters = ref(false)

const toggleAdvancedFilters = () => {
    showAdvancedFilters.value = !showAdvancedFilters.value
}

const isTableLayout = computed(() => layoutMode.value === 'table')

// Tự quản lý pagination state (không dùng useTableData vì không có server-side pagination)
// Sử dụng URL sync thủ công
const route = useRoute()
const router = useRouter()

// Pagination state
const zeroBasedPage = ref(0)
const pageSize = ref(10)

// Sync với URL
const syncFromUrl = () => {
    const pageParam = route.query.page
    const sizeParam = route.query.size

    if (pageParam) {
        const page = parseInt(pageParam, 10)
        if (!isNaN(page) && page >= 0) {
            zeroBasedPage.value = page
        }
    }

    if (sizeParam) {
        const size = parseInt(sizeParam, 10)
        if (!isNaN(size) && size > 0) {
            pageSize.value = size
        }
    }
}

const syncToUrl = () => {
    const query = { ...route.query }

    if (zeroBasedPage.value > 0) {
        query.page = String(zeroBasedPage.value)
    } else {
        delete query.page
    }

    if (pageSize.value !== 10) {
        query.size = String(pageSize.value)
    } else {
        delete query.size
    }

    router.replace({ query })
}

// Sync từ URL khi mount
syncFromUrl()

// Watch URL changes
watch(() => route.query, () => {
    syncFromUrl()
}, { deep: true })

// Tính toán totalPages và totalElements từ filtered data (client-side pagination)
const totalElements = computed(() => {
    const rawProducts = allProducts.value || []
    const filtered = applyFiltersAndSort(rawProducts)
    return filtered.length
})

const totalPages = computed(() => Math.ceil(totalElements.value / pageSize.value) || 1)

// Expose pagination properties
const currentPage = computed(() => zeroBasedPage.value + 1)
const setPageFromZero = (page) => {
    // Clamp page trong phạm vi hợp lệ
    const maxPage = Math.max(0, totalPages.value - 1)
    zeroBasedPage.value = Math.max(0, Math.min(page, maxPage))
    syncToUrl()
}
const updatePageSize = (size) => {
    pageSize.value = size
    zeroBasedPage.value = 0 // Reset về trang đầu
    syncToUrl()
}

const setLayout = (mode) => {
    if (layoutMode.value === mode) return
    layoutMode.value = mode
    updatePageSize(mode === 'grid' ? 12 : 10)
}

const isToggling = (id) => Boolean(togglingAvailability[id])

// Lấy dữ liệu bestseller
const fetchBestsellerData = async () => {
    try {
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - 30) // 30 ngày gần nhất

        const bestsellerResponse = await reportService.getBestSellers(
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0],
            100, // Top 100
            'quantity'
        )

        const ids = new Set()
        const dataMap = {}

        if (bestsellerResponse?.items) {
            bestsellerResponse.items.forEach((item) => {
                if (item.productId) {
                    ids.add(item.productId)
                    dataMap[item.productId] = {
                        totalQuantitySold: item.totalQuantitySold || 0,
                        totalRevenueGenerated: item.totalRevenueGenerated || 0,
                        rank: item.rank || 0
                    }
                }
            })
        }

        bestsellerProductIds.value = ids
        bestsellerData.value = dataMap
    } catch (error) {
        logger.warn('[Products] Không thể tải dữ liệu bán chạy:', error)
        // Không hiển thị lỗi, chỉ log
    }
}

// Fetch tất cả products (với size lớn để có đủ dữ liệu filter)
const fetchAllProducts = async () => {
    await execute(async () => {
        const params = {
            name: filters.name || undefined,
            available: filters.available !== null ? filters.available : undefined,
            page: 0,
            size: 1000 // Lấy nhiều để có đủ dữ liệu filter
        }

        if (filters.categoryId !== null && filters.categoryId !== undefined) {
            params.categoryId = filters.categoryId
        }

        const response = await productService.getProducts(params)
        const list = response.content || []

        // Nếu có nhiều trang, fetch thêm
        if (response.totalPages > 1) {
            const allPages = []
            allPages.push(...list)

            for (let page = 1; page < response.totalPages && page < 10; page++) {
                const pageParams = { ...params, page }
                const pageResponse = await productService.getProducts(pageParams)
                if (pageResponse.content) {
                    allPages.push(...pageResponse.content)
                }
            }

            allProducts.value = allPages
        } else {
            allProducts.value = list
        }

        // Cập nhật thống kê
        const activeCount = allProducts.value.filter((p) => p.available).length
        const inactiveCount = allProducts.value.filter((p) => !p.available).length
        const categorySet = new Set(allProducts.value.map((p) => p.categoryName).filter(Boolean))
        productStats.value = {
            total: response.totalElements ?? allProducts.value.length,
            active: activeCount,
            inactive: inactiveCount,
            categories: categorySet.size
        }

        // products sẽ tự động cập nhật qua computed
    }, 'Không thể tải danh sách sản phẩm.')
}

// Áp dụng filter và sort cho products (tương tự Orders.vue)
const applyFiltersAndSort = (productList) => {
    if (!productList || productList.length === 0) {
        return []
    }

    let result = [...productList]

    // Filter theo giá
    if (filters.priceMin !== null && filters.priceMin !== undefined && filters.priceMin > 0) {
        result = result.filter((p) => (p.price || 0) >= filters.priceMin)
    }
    if (filters.priceMax !== null && filters.priceMax !== undefined && filters.priceMax > 0) {
        result = result.filter((p) => (p.price || 0) <= filters.priceMax)
    }

    // Filter theo bestseller
    if (filters.bestseller !== null && filters.bestseller !== undefined) {
        if (filters.bestseller === true) {
            result = result.filter((p) => bestsellerProductIds.value.has(p.id))
        } else if (filters.bestseller === false) {
            result = result.filter((p) => !bestsellerProductIds.value.has(p.id))
        }
    }

    // Sort
    if (sortState.value) {
        const [field, order] = sortState.value.split('-')
        const isAsc = order === 'asc'

        result.sort((a, b) => {
            let comparison = 0

            if (field === 'name') {
                comparison = (a.name || '').localeCompare(b.name || '', 'vi')
            } else if (field === 'price') {
                comparison = (a.price || 0) - (b.price || 0)
            } else if (field === 'bestseller') {
                const aIsBestseller = bestsellerProductIds.value.has(a.id)
                const bIsBestseller = bestsellerProductIds.value.has(b.id)
                if (aIsBestseller && !bIsBestseller) comparison = -1
                else if (!aIsBestseller && bIsBestseller) comparison = 1
                else {
                    // Nếu cùng là bestseller hoặc không, sort theo số lượng bán
                    const aSales = bestsellerData.value[a.id]?.totalQuantitySold || 0
                    const bSales = bestsellerData.value[b.id]?.totalQuantitySold || 0
                    comparison = bSales - aSales // Giảm dần
                }
            }

            return isAsc ? comparison : -comparison
        })
    }

    return result
}

// Computed để tự động cập nhật từ allProducts và apply client-side filters + pagination (tương tự Orders.vue)
const products = computed(() => {
    const rawProducts = allProducts.value || []
    const filtered = applyFiltersAndSort(rawProducts)

    // Client-side pagination
    const currentPage = zeroBasedPage.value
    const currentPageSize = pageSize.value
    const startIndex = currentPage * currentPageSize
    const endIndex = startIndex + currentPageSize

    return filtered.slice(startIndex, endIndex)
})

const fetchProducts = async () => {
    await fetchAllProducts()
}

const fetchCategories = async () => {
    await execute(async () => {
        const response = await categoryService.getCategories()
        categories.value = Array.isArray(response?.content) ? response.content : response
    }, 'Không thể tải danh mục. Vui lòng thử lại.', {
        showToast: false // Không hiển thị toast cho categories, chỉ log error
    })
}

const debouncedFetchProducts = debounce(() => {
    fetchProducts()
}, 300)

const handleSearchInput = () => {
    debouncedFetchProducts()
}

// Watch cho các filter cơ bản (cần fetch lại từ API)
watch(
    () => [filters.name, filters.categoryId, filters.available],
    () => {
        setPageFromZero(0)
        fetchProducts()
    }
)

// Watch cho các filter nâng cao và sort (reset về trang đầu, products sẽ tự động cập nhật qua computed)
watch(
    () => [filters.priceMin, filters.priceMax, filters.bestseller, sortState.value],
    () => {
        setPageFromZero(0)
    }
)

// Thiết lập phím tắt
useKeyboardShortcuts({
    page: 'products',
    shortcuts: {
        'new-product': {
            handler: () => {
                if (canCreate.value) {
                    openModal()
                }
            }
        },
        'edit-selected': {
            handler: () => {
                // Edit first selected product if any
                if (selectedProduct.value) {
                    openModal(selectedProduct.value)
                }
            }
        }
    }
})

const openModal = (product = null) => {
    selectedProduct.value = product ? { ...product } : null
    productModal.value?.show()
}

const openDetailModal = async (product) => {
    detailProduct.value = product ? { ...product } : null
    await nextTick()
    productDetailModal.value?.show()
}

const openRecipeModal = (product) => {
    selectedProduct.value = product ? { ...product } : null
    productRecipeModal.value?.show()
}

const handleRecipeSaved = () => {
    // Recipe saved successfully
}

const openDeleteModal = (product) => {
    if (!product?.id) return
    deleteTarget.value = product
    nextTick(() => {
        deleteModalInstance?.show()
    })
}

const closeDeleteModal = () => {
    deleteModalInstance?.hide()
}

// Hàm wrapper để đảm bảo event được xử lý đúng
const handleDeleteClick = (event) => {
    try {
        if (event) {
            event.preventDefault()
            event.stopPropagation()
        }

        // Kiểm tra deleteTarget trước khi gọi
        if (!deleteTarget.value?.id) {
            logger.warn('[Products] Không tìm thấy sản phẩm cần xóa')
            toast.error('Không tìm thấy sản phẩm cần xóa')
            return
        }

        confirmDeleteProduct()
    } catch (err) {
        logger.error('[Products] Lỗi khi xóa sản phẩm:', err)
        toast.error('Có lỗi xảy ra khi xóa sản phẩm')
    }
}

const confirmDeleteProduct = async () => {
    if (!deleteTarget.value?.id) {
        logger.warn('[Products] Không tìm thấy ID sản phẩm cần xóa')
        toast.error('Không tìm thấy sản phẩm cần xóa')
        return
    }

    deletingProduct.value = true
    const productName = deleteTarget.value.name || deleteTarget.value.code || 'sản phẩm này'
    const productId = deleteTarget.value.id

    try {
        await productService.deleteProduct(productId)

        // Xóa khỏi store nếu có
        try {
            const { useProductStore } = await import('@/store/products')
            const productStore = useProductStore()
            productStore.removeProduct(deleteTarget.value.id)
        } catch (storeError) {
            // Store không có sẵn, bỏ qua
            logger.debug('[Products] Store không khả dụng:', storeError)
        }

        // Xóa khỏi allProducts
        const index = allProducts.value.findIndex((item) => item.id === deleteTarget.value.id)
        if (index !== -1) {
            allProducts.value.splice(index, 1)
            applyFiltersAndSort()
        } else {
            // Nếu không tìm thấy trong local, reload từ server
            await fetchProducts()
        }

        toast.success(`Đã xóa sản phẩm "${productName}" thành công`)
        deleteTarget.value = null
        closeDeleteModal()
    } catch (err) {
        // Xử lý lỗi cụ thể từ backend
        const errorMessage = err.response?.data?.message || err.message || 'Không thể xóa sản phẩm'

        // Kiểm tra nếu sản phẩm đã có trong đơn hàng
        const lowerMessage = errorMessage.toLowerCase()
        if (lowerMessage.includes('đơn hàng') ||
            lowerMessage.includes('order') ||
            lowerMessage.includes('không thể xóa') ||
            lowerMessage.includes('cannot delete') ||
            lowerMessage.includes('deletion not allowed')) {
            toast.error(`Không thể xóa sản phẩm "${productName}" vì đã có trong đơn hàng. Vui lòng sử dụng chức năng "Ngừng bán" thay vì xóa.`, {
                duration: 6000
            })
        } else {
            toast.error(`Không thể xóa sản phẩm "${productName}": ${errorMessage}`)
        }
    } finally {
        deletingProduct.value = false
    }
}

const openToggleModal = (product) => {
    if (!product?.id) return
    toggleTarget.value = product
    nextTick(() => {
        toggleModalInstance?.show()
    })
}

const closeToggleModal = () => {
    toggleModalInstance?.hide()
    toggleTarget.value = null
}

const handleToggleConfirm = async () => {
    if (!toggleTarget.value?.id) return
    await handleToggleAvailability(toggleTarget.value)
    closeToggleModal()
}

const handleToggleAvailability = async (product) => {
    if (!product?.id) return
    togglingAvailability[product.id] = true
    try {
        await execute(async () => {
            const updated = await productService.toggleProductAvailability(product.id)
            toast.success(updated.available ? 'Sản phẩm đã mở bán trở lại' : 'Sản phẩm đã ngừng bán')
            if (filters.available !== null && updated.available !== filters.available) {
                fetchProducts()
            } else {
                // Cập nhật trong allProducts
                const index = allProducts.value.findIndex((item) => item.id === updated.id)
                if (index !== -1) {
                    allProducts.value.splice(index, 1, { ...allProducts.value[index], ...updated })
                    applyFiltersAndSort()
                }
            }
        }, 'Không thể thay đổi trạng thái. Vui lòng thử lại.', {
            showToast: false // Đã có toast riêng
        })
    } finally {
        delete togglingAvailability[product.id]
    }
}

const handleProductSaved = () => {
    fetchProducts()
}

const handlePageChange = (page) => {
    setPageFromZero(page)
    // products sẽ tự động cập nhật qua computed khi zeroBasedPage thay đổi
}

const handlePageSizeChange = (size) => {
    updatePageSize(size)
    setPageFromZero(0) // Reset về trang đầu khi thay đổi pageSize
}

const resetFilters = () => {
    filters.name = ''
    filters.categoryId = null
    filters.available = null
    filters.priceMin = null
    filters.priceMax = null
    filters.bestseller = null
    sortState.value = ''
    setPageFromZero(0)
    fetchProducts()
}

// Watch được xử lý tự động bởi computed products, không cần watch thủ công

onBeforeRouteLeave(() => {
    // Page state is managed by useTableData URL sync
})

// Khởi tạo: fetch bestseller data và products
fetchBestsellerData()
fetchCategories()
fetchProducts()

// Khởi tạo modal xóa
watch(
    () => deleteModalRef.value,
    (element) => {
        if (!element) return
        deleteModalInstance = new Modal(element, { backdrop: 'static' })
    },
    { immediate: true }
)

// Khởi tạo modal toggle
watch(
    () => toggleModalRef.value,
    (element) => {
        if (!element) return
        toggleModalInstance = new Modal(element, { backdrop: 'static' })
    },
    { immediate: true }
)
</script>

<style scoped>
/* Page-specific styles only - Global styles (.page-header, .page-title, .page-subtitle, .filter-card, .state-block) are in components.scss */

/* Filter Card - Chuẩn hóa theo base.css */
.filter-card {
    margin-bottom: var(--spacing-4);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

.filter-card :global(.card-body) {
    padding: var(--spacing-4);
    background: var(--color-card);
}

.filter-card :global(.form-label) {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--color-heading);
    margin-bottom: var(--spacing-2);
    font-family: var(--font-family-sans);
}

.filter-card :global(.form-control),
.filter-card :global(.form-select) {
    height: 40px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: var(--spacing-2) var(--spacing-3);
    font-size: var(--font-size-base);
    background: var(--color-card);
    color: var(--color-heading);
    transition: all var(--transition-base);
    font-family: var(--font-family-sans);
}

.filter-card :global(.form-control:focus),
.filter-card :global(.form-select:focus) {
    border-color: var(--color-primary);
    outline: 2px solid var(--color-primary);
    outline-offset: 0;
    box-shadow: none;
}

.filter-card :global(.input-group-text) {
    height: 40px;
    background: var(--color-card-muted);
    border-color: var(--color-border);
    color: var(--color-text-muted);
    padding: var(--spacing-2) var(--spacing-3);
}

.filter-card :global(.input-group-text i) {
    font-size: 18px;
    line-height: 1;
}

.filter-card :global(.btn-outline-secondary) {
    padding: var(--spacing-2) var(--spacing-3);
    border-radius: var(--radius-sm);
    font-weight: var(--font-weight-medium);
    font-size: var(--font-size-base);
    transition: all var(--transition-base);
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-2);
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
    font-family: var(--font-family-sans);
}

.filter-card :global(.btn-outline-secondary:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.filter-card :global(.btn-outline-secondary i) {
    font-size: 18px;
    line-height: 1;
}

/* Layout Toggle - Exact match with image */
.layout-toggle {
    display: inline-flex;
    gap: var(--spacing-3);
    background: transparent;
    padding: 0;
    border: none;
}

.layout-toggle .btn {
    min-width: auto;
    padding: 0.65rem 1.25rem;
    font-weight: var(--font-weight-semibold);
    border-radius: 9999px;
    font-family: var(--font-family-sans);
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    transition: all 0.2s ease;
}

.layout-toggle .btn-primary {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: #ffffff;
}

.layout-toggle .btn-outline-primary {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

.layout-toggle .btn-outline-primary:hover:not(:disabled) {
    background: var(--color-card);
    border-color: var(--color-primary);
    color: var(--color-primary);
}

.layout-toggle .btn i {
    font-size: 1rem;
    line-height: 1;
    color: inherit;
}

.layout-toggle .btn-primary i {
    color: #ffffff;
}

.layout-toggle .btn-outline-primary i {
    color: var(--color-primary);
}

/* Table - Minimal Table Styling */
.products-page :global(.table) {
    margin-bottom: 0;
    border-collapse: separate;
    border-spacing: 0;
    width: 100%;
}

.products-page :global(.table-wrapper) {
    max-height: calc(100vh - 400px);
    overflow-y: auto;
}

.products-page :global(.table-sticky-header thead th) {
    position: sticky;
    top: 0;
    z-index: 10;
    background: var(--color-card-muted);
}

.products-page :global(.table thead th) {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    background: var(--color-card-muted);
    border-bottom: 1px solid var(--color-border);
    padding: var(--spacing-3);
    vertical-align: middle;
    font-family: var(--font-family-sans);
}

.products-page :global(.table tbody td) {
    font-size: var(--font-size-base);
    padding: var(--spacing-3);
    border-bottom: 1px solid var(--color-border);
    vertical-align: middle;
    font-family: var(--font-family-sans);
}

.products-page :global(.table tbody tr:last-child td) {
    border-bottom: none;
}

.products-page :global(.table tbody tr:hover) {
    background: var(--color-card-muted);
}

.products-page :global(.table .fw-semibold) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.product-thumb {
    width: 56px;
    height: 56px;
    object-fit: cover;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    transition: all var(--transition-base);
}

.product-thumb--clickable {
    cursor: pointer;
}

.product-thumb--clickable:hover {
    border-color: var(--color-primary);
    transform: scale(1.05);
    box-shadow: 0 2px 8px rgba(44, 120, 115, 0.2);
}

.product-name--clickable {
    cursor: pointer;
}

.product-name--clickable span {
    color: var(--color-heading);
    transition: color var(--transition-base);
}

.product-name--clickable:hover span {
    color: var(--color-primary);
    text-decoration: underline;
}

/* Badge System - Chuẩn hóa theo tiêu chuẩn */
.badge {
    display: inline-flex;
    align-items: center;
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
    border: 1px solid;
    white-space: nowrap;
    line-height: 1.4;
}

/* Status Badges */
.badge-status {
    display: inline-flex;
    align-items: center;
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
    border: 1px solid;
    white-space: nowrap;
    line-height: 1.4;
}

.badge-status--success,
.badge-status--active {
    background: rgba(34, 197, 94, 0.18);
    border-color: #22c55e;
    color: #22c55e;
}

.badge-status--warning,
.badge-status--pending {
    background: rgba(251, 191, 36, 0.18);
    border-color: #f59e0b;
    color: #f59e0b;
}

.badge-status--danger,
.badge-status--cancelled {
    background: rgba(244, 63, 94, 0.18);
    border-color: #ef4444;
    color: #ef4444;
}

.badge-status--info,
.badge-status--transferred {
    background: rgba(14, 165, 233, 0.18);
    border-color: #0ea5e9;
    color: #0ea5e9;
}

.badge-status--default,
.badge-status--inactive {
    background: var(--color-card-muted);
    border-color: var(--color-border);
    color: var(--color-text-muted);
}

/* Type Badges */
.badge-type {
    display: inline-flex;
    align-items: center;
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
    border: 1px solid;
    white-space: nowrap;
    line-height: 1.4;
}

.badge-type--primary,
.badge-type--percentage {
    background: rgba(14, 165, 233, 0.18);
    border-color: #0ea5e9;
    color: #0ea5e9;
}

.badge-type--secondary,
.badge-type--fixed {
    background: var(--color-card-muted);
    border-color: var(--color-border);
    color: var(--color-text-muted);
}

.badge-type--success,
.badge-type--premium {
    background: rgba(34, 197, 94, 0.18);
    border-color: #22c55e;
    color: #22c55e;
}

/* Action Buttons - Tối ưu hóa không gian */
.action-buttons {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    justify-content: center;
}

.action-dropdown {
    position: relative;
}

.action-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    height: 36px;
    padding: 8px 12px;
    border-radius: var(--radius-sm);
    border: 1px solid;
    background: var(--color-card);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    transition: all var(--transition-base);
    white-space: nowrap;
    cursor: pointer;
    font-family: var(--font-family-sans);
}

.action-button--icon-only {
    width: 36px;
    padding: 8px;
    min-width: 36px;
}

.action-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    pointer-events: none;
}

.action-button i {
    font-size: 18px;
    line-height: 1;
}

/* Primary (Chỉnh sửa) */
.action-button--primary {
    border-color: var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

.action-button--primary:hover:not(:disabled) {
    background: rgba(44, 120, 115, 0.12);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(44, 120, 115, 0.2);
}

/* Secondary (Kebab menu) */
.action-button--secondary {
    border-color: var(--color-border);
    color: var(--color-text-muted);
    background: var(--color-card);
}

.action-button--secondary:hover:not(:disabled) {
    background: var(--color-card-muted);
    border-color: var(--color-primary);
    color: var(--color-primary);
}

/* Info (Xem chi tiết, Công thức) */
.action-button--info {
    border-color: #0ea5e9;
    color: #0ea5e9;
    background: var(--color-card);
}

.action-button--info:hover:not(:disabled) {
    background: rgba(14, 165, 233, 0.18);
    border-color: #0284c7;
    color: #0284c7;
}

/* Warning (Bật/Tắt) */
.action-button--warning {
    border-color: var(--color-border);
    color: var(--color-warning);
    background: var(--color-card);
}

.action-button--warning:hover:not(:disabled) {
    background: var(--color-warning);
    color: var(--color-text-inverse);
    border-color: var(--color-warning);
}

/* Danger (Xóa) */
.action-button--danger {
    border-color: var(--color-danger);
    color: var(--color-danger);
    background: var(--color-card);
}

.action-button--danger:hover:not(:disabled) {
    background: var(--color-danger);
    color: var(--color-text-inverse);
    border-color: var(--color-danger);
}

/* Dropdown Menu Styles */
.products-page :global(.dropdown-menu) {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-card);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    padding: var(--spacing-1);
    min-width: 180px;
    font-family: var(--font-family-sans);
}

.products-page :global(.dropdown-item) {
    padding: var(--spacing-2) var(--spacing-3);
    font-size: var(--font-size-base);
    color: var(--color-heading);
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    transition: all var(--transition-base);
    font-family: var(--font-family-sans);
}

.products-page :global(.dropdown-item:hover) {
    background: var(--color-card-muted);
    color: var(--color-primary);
}

.products-page :global(.dropdown-item--danger) {
    color: var(--color-danger);
}

.products-page :global(.dropdown-item--danger:hover) {
    background: var(--color-soft-rose);
    color: var(--color-danger);
}

.products-page :global(.dropdown-item i) {
    font-size: 16px;
    width: 20px;
    text-align: center;
}

.products-page :global(.dropdown-divider) {
    margin: var(--spacing-1) 0;
    border-color: var(--color-border);
    opacity: 0.5;
}

/* Status Toggle Button - Đã được thay thế bằng action-button--warning */

/* Product Grid Layout - Chuẩn hóa */
.product-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: var(--spacing-4);
}

.product-card {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-card);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
    transition: all var(--transition-base);
    cursor: pointer;
    position: relative;
}

.product-card:hover {
    background: var(--color-card-muted);
    border-color: var(--color-primary);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.product-card__media {
    position: relative;
}

.product-card__media img {
    width: 100%;
    height: 170px;
    object-fit: cover;
}

.product-card__media .badge-status {
    position: absolute;
    top: var(--spacing-3);
    left: var(--spacing-3);
    backdrop-filter: blur(6px);
    box-shadow: var(--shadow-base);
}

.product-card__body {
    padding: 0 var(--spacing-4);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
}

.product-card__title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    line-height: var(--line-height-tight);
    font-family: var(--font-family-sans);
}

.product-card__meta {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-3);
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    line-height: var(--line-height-base);
    font-family: var(--font-family-sans);
}

.product-card__meta i {
    font-size: 16px;
    line-height: 1;
}

.product-card__price {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: var(--font-weight-semibold);
    color: var(--color-primary);
    font-size: var(--font-size-base);
    font-family: var(--font-family-sans);
}

.product-card__price .label {
    color: var(--color-text-muted);
    font-weight: var(--font-weight-medium);
}

.product-card__actions {
    padding: 0 var(--spacing-4) var(--spacing-4);
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--spacing-2);
    position: relative;
    z-index: 1;
}

.product-card__actions .action-button {
    width: 100%;
    cursor: pointer;
}


/* Header - Chuẩn hóa theo base.css */
.products-header {
    padding: var(--spacing-4);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    margin-bottom: var(--spacing-4);
}

.products-header__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-4);
    flex-wrap: wrap;
}

.products-header__title-section {
    flex: 1;
    min-width: 0;
}

.products-header__title {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    margin-bottom: var(--spacing-1);
    font-size: var(--font-size-xl);
    line-height: var(--line-height-tight);
    font-family: var(--font-family-sans);
}

.products-header__subtitle {
    margin-bottom: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
    line-height: var(--line-height-base);
    font-weight: var(--font-weight-normal);
    font-family: var(--font-family-sans);
}

.products-header__actions {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    flex-wrap: wrap;
    justify-content: flex-end;
}

.products-header__actions .btn {
    padding: var(--spacing-2) var(--spacing-3);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    transition: all var(--transition-base);
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-2);
    font-family: var(--font-family-sans);
}

.products-header__actions .btn-primary {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-text-inverse);
    height: 40px;
    padding: 12px 20px;
}

.products-header__actions .btn-primary:hover:not(:disabled) {
    background: var(--color-primary-dark);
    border-color: var(--color-primary-dark);
}

.products-header__actions .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.products-header__actions .btn i {
    font-size: 18px;
    line-height: 1;
}

.products-header__actions .btn-primary i {
    margin-right: 8px;
}

.products-header__actions .btn-group {
    display: flex;
    gap: var(--spacing-2);
}

.products-header__actions .btn-group .btn {
    min-width: 120px;
}

/* KPI Cards - Flat Design */
.products-summary {
    margin-bottom: var(--spacing-4);
}

.kpi-card {
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: var(--spacing-4);
    display: flex;
    align-items: center;
    gap: var(--spacing-4);
    min-height: 120px;
    height: 100%;
    transition: all var(--transition-base);
}

.kpi-card:hover {
    background: var(--color-card-muted);
    border-color: var(--color-primary);
}

.kpi-card__icon {
    width: 56px;
    height: 56px;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    flex-shrink: 0;
}

/* Màu icon - dùng var(--color-soft-*) */
.kpi-card--total .kpi-card__icon {
    background: var(--color-soft-primary);
    color: var(--color-primary);
}

.kpi-card--active .kpi-card__icon {
    background: var(--color-soft-emerald);
    color: var(--color-success);
}

.kpi-card--inactive .kpi-card__icon {
    background: var(--color-soft-rose);
    color: var(--color-danger);
}

.kpi-card--categories .kpi-card__icon {
    background: var(--color-soft-sky);
    color: var(--color-info);
}

.kpi-card__content {
    flex: 1;
    min-width: 0;
}

.kpi-card__label {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-2);
    font-family: var(--font-family-sans);
}

.kpi-card__value {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    line-height: var(--line-height-tight);
    font-family: var(--font-family-sans);
}

/* Cards - Chuẩn hóa */
.products-page :global(.card) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

.products-page :global(.card-body) {
    padding: var(--spacing-4);
    background: var(--color-card);
}

.products-page :global(.tabs-card) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

/* Delete Info Card - Chuẩn hóa */
.delete-info-card {
    padding: var(--spacing-4);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card-muted);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
}

.delete-info-item {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--spacing-3);
}

.delete-info-label {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-muted);
    flex-shrink: 0;
    min-width: 120px;
    font-family: var(--font-family-sans);
}

.delete-info-value {
    font-size: var(--font-size-base);
    color: var(--color-heading);
    text-align: right;
    word-break: break-word;
    font-family: var(--font-family-sans);
}

/* Confirm Card - Chuẩn hóa */
.confirm-card {
    padding: var(--spacing-4);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card-muted);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
}

.confirm-item {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--spacing-3);
}

.confirm-label {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-muted);
    flex-shrink: 0;
    min-width: 120px;
    font-family: var(--font-family-sans);
}

.confirm-value {
    font-size: var(--font-size-base);
    color: var(--color-heading);
    text-align: right;
    word-break: break-word;
    font-family: var(--font-family-sans);
}

/* Modal - Chuẩn hóa */
.products-page :global(.modal-content) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

.products-page :global(.modal-header) {
    padding: var(--spacing-4);
    border-bottom: 1px solid var(--color-border);
    background: var(--color-card);
}

.products-page :global(.modal-header__content) {
    flex: 1;
}

.products-page :global(.modal-title) {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    margin-bottom: 0;
    font-family: var(--font-family-sans);
}

.products-page :global(.modal-subtitle) {
    font-size: var(--font-size-base);
    color: var(--color-text-muted);
    margin-top: var(--spacing-1);
    font-family: var(--font-family-sans);
}

.products-page :global(.modal-body) {
    padding: var(--spacing-4);
    background: var(--color-card);
}

.products-page :global(.modal-body p) {
    font-family: var(--font-family-sans);
}

.products-page :global(.modal-body strong) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.products-page :global(.modal-footer) {
    padding: var(--spacing-4);
    border-top: 1px solid var(--color-border);
    background: var(--color-card);
}

.products-page :global(.modal-footer .btn) {
    padding: var(--spacing-2) var(--spacing-4);
    border-radius: var(--radius-sm);
    font-weight: var(--font-weight-medium);
    font-size: var(--font-size-base);
    transition: all var(--transition-base);
    font-family: var(--font-family-sans);
}

.products-page :global(.modal-footer .btn-outline-secondary) {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

.products-page :global(.modal-footer .btn-outline-secondary:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.products-page :global(.modal-footer .btn-primary) {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-text-inverse);
}

.products-page :global(.modal-footer .btn-primary:hover:not(:disabled)) {
    background: var(--color-primary-dark);
}

.products-page :global(.modal-footer .btn-danger) {
    background: var(--color-danger);
    border-color: var(--color-danger);
    color: var(--color-text-inverse);
}

.products-page :global(.modal-footer .btn-danger:hover:not(:disabled)) {
    background: var(--color-danger-dark);
}

.products-page :global(.modal-footer .btn:disabled) {
    opacity: 0.6;
    cursor: not-allowed;
}

/* Global Button Styles - Đồng bộ với các trang trước */
.products-page :global(.btn-primary) {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-text-inverse);
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
}

.products-page :global(.btn-primary:hover:not(:disabled)) {
    background: var(--color-primary-dark);
}

.products-page :global(.btn-primary:disabled) {
    opacity: 0.6;
    cursor: not-allowed;
}

.products-page :global(.btn-outline-primary) {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
}

.products-page :global(.btn-outline-primary:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.products-page :global(.btn-outline-secondary) {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
}

.products-page :global(.btn-outline-secondary:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.products-page :global(.btn-danger) {
    background: var(--color-danger);
    border-color: var(--color-danger);
    color: var(--color-text-inverse);
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
}

.products-page :global(.btn-danger:hover:not(:disabled)) {
    background: var(--color-danger-dark);
}

.products-page :global(.btn-sm) {
    padding: var(--spacing-1) var(--spacing-3);
    font-size: var(--font-size-sm);
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
}

/* Responsive */
@media (max-width: 992px) {
    .products-header__content {
        flex-direction: column;
        align-items: flex-start;
    }

    .products-header__actions {
        width: 100%;
        justify-content: flex-start;
    }

    .kpi-card {
        flex-direction: column;
        text-align: center;
        min-height: auto;
    }

    .kpi-card__icon {
        width: 48px;
        height: 48px;
        font-size: 20px;
    }
}

@media (max-width: 768px) {
    .product-card__actions {
        grid-template-columns: 1fr;
    }

    .action-grid {
        flex-direction: column;
        width: 100%;
    }

    .action-button {
        width: 100%;
    }

    .action-button span {
        display: inline;
    }

    .layout-toggle {
        width: 100%;
    }

    .layout-toggle .btn {
        flex: 1;
    }

    .status-toggle-btn__label {
        display: none;
    }

    .product-grid {
        grid-template-columns: 1fr;
    }
}

/* Infinite scroll sentinel */
.infinite-scroll-sentinel {
    padding: var(--spacing-6) var(--spacing-4);
    text-align: center;
    min-height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.loading-more {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-2);
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
}

.no-more-data {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-2);
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
}

.no-more-data i {
    font-size: 18px;
}

</style>
