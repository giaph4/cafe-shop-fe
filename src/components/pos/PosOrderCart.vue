<template>
  <div class="pos-cart">
    <header class="pos-cart__header">
      <div class="pos-cart__header-top">
        <div class="pos-cart__header-left">
          <h4 class="pos-cart__title">
            {{ cartTitle }}
          </h4>
          <button
            v-if="showSelectTableButton"
            class="btn btn-outline-primary btn-sm"
            type="button"
            @click="requestTableSelection"
          >
            <i class="bi bi-grid-3x3-gap me-1" />
            Chọn bàn
          </button>
        </div>
        <div class="pos-cart__header-right">
          <button
            v-if="showExpandButton"
            class="btn btn-outline-secondary btn-sm pos-cart__expand-btn"
            type="button"
            :title="`Mở rộng giỏ hàng (${cartItemCount} sản phẩm)`"
            @click="openDrawer"
          >
            <i class="bi bi-arrows-angle-expand me-1" />
            Mở rộng
            <span
              v-if="cartItemCount > 5"
              class="badge bg-primary ms-2"
            >{{ cartItemCount }}</span>
          </button>
          <span
            class="status-pill"
            :class="orderStatusClass"
          >{{ orderStatusLabel }}</span>
        </div>
      </div>
      <p
        v-if="localOrder.code || localOrder.id"
        class="pos-cart__order-code"
      >
        Mã đơn: #{{ localOrder.code || localOrder.id }}
      </p>
    </header>

    <EmptyState
      v-if="!order && !isCreatingNew"
      title="Chưa có đơn hàng"
      message="Chưa có đơn hàng nào cho bàn này."
    >
      <template #icon>
        <i class="bi bi-plus-square" />
      </template>
      <template #action>
        <button
          class="btn btn-primary"
          @click="createNewOrder"
        >
          <i class="bi bi-plus-lg" />
          Tạo đơn hàng mới
        </button>
      </template>
    </EmptyState>

    <template v-else>
      <section
        v-if="!cartIsEmpty"
        class="pos-cart__items"
      >
        <div
          v-for="(item, index) in localOrder.items"
          :key="item.id || item.productId || index"
          class="pos-cart__item"
        >
          <div class="pos-cart__item-info">
            <div class="pos-cart__item-header">
              <button
                class="btn btn-sm btn-outline-danger pos-cart__delete-btn--inline"
                type="button"
                :disabled="isProcessing('quantity')"
                aria-label="Xóa món"
                title="Xóa (Phím Delete)"
                @click="removeItem(index)"
              >
                <i class="bi bi-trash" />
              </button>
              <div class="pos-cart__item-name-wrapper">
                <h6 class="mb-1">
                  {{ item.productName }}
                </h6>
                <div
                  v-if="item.customization"
                  class="pos-cart__item-customization"
                >
                  <span
                    v-if="item.customization.size"
                    class="customization-badge"
                  >{{ item.customization.size }}</span>
                  <span
                    v-if="item.customization.ice"
                    class="customization-badge"
                  >{{ getIceLabel(item.customization.ice) }}</span>
                  <span
                    v-if="item.customization.sugar"
                    class="customization-badge"
                  >{{ getSugarLabel(item.customization.sugar) }}</span>
                </div>
                <p class="mb-0 text-primary fw-semibold">
                  {{ formatCurrencySafe(item.priceAtOrder) }} × {{ item.quantity }}
                </p>
              </div>
            </div>
            <!-- Ghi chú cho món -->
            <div class="pos-cart__item-notes">
              <div
                v-if="editingNotesIndex !== index"
                class="pos-cart__item-notes-display"
              >
                <span
                  v-if="item.notes"
                  class="pos-cart__item-notes-text"
                >
                  <i class="bi bi-sticky me-1" />
                  {{ item.notes }}
                </span>
                <button
                  class="btn btn-sm btn-outline-secondary pos-cart__item-notes-edit-btn"
                  type="button"
                  :disabled="isProcessing('quantity')"
                  title="Chỉnh sửa ghi chú"
                  @click="startEditNotes(index)"
                >
                  <i
                    :class="item.notes ? 'bi bi-pencil' : 'bi bi-plus-circle'"
                  />
                  {{ item.notes ? 'Sửa' : 'Thêm ghi chú' }}
                </button>
              </div>
              <div
                v-else
                class="pos-cart__item-notes-edit"
              >
                <input
                  v-model="editingNotesValue"
                  type="text"
                  class="form-control form-control-sm"
                  placeholder="Nhập ghi chú cho món này..."
                  :disabled="isProcessing('quantity')"
                  @keyup.enter="saveItemNotes(index)"
                  @keyup.esc="cancelEditNotes"
                  @blur="saveItemNotes(index)"
                >
                <div class="pos-cart__item-notes-edit-actions">
                  <button
                    class="btn btn-sm btn-success"
                    type="button"
                    :disabled="isProcessing('quantity')"
                    @click="saveItemNotes(index)"
                  >
                    <i class="bi bi-check" />
                  </button>
                  <button
                    class="btn btn-sm btn-outline-secondary"
                    type="button"
                    :disabled="isProcessing('quantity')"
                    @click="cancelEditNotes"
                  >
                    <i class="bi bi-x" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div class="pos-cart__item-actions">
            <div class="quantity-controls">
              <button
                class="btn btn-outline-secondary quantity-btn quantity-btn--large"
                type="button"
                :disabled="isProcessing('quantity')"
                aria-label="Giảm số lượng"
                title="Giảm (Phím -)"
                @click="updateQuantity(index, -1)"
              >
                <i class="bi bi-dash" />
              </button>
              <input
                type="number"
                class="quantity-input"
                :value="item.quantity"
                min="1"
                :disabled="isProcessing('quantity')"
                @input="setQuantity(index, $event.target.value)"
                @change="setQuantity(index, $event.target.value)"
                @blur="setQuantity(index, item.quantity)"
              >
              <button
                class="btn btn-outline-secondary quantity-btn quantity-btn--large"
                type="button"
                :disabled="isProcessing('quantity')"
                aria-label="Tăng số lượng"
                title="Tăng (Phím +)"
                @click="updateQuantity(index, 1)"
              >
                <i class="bi bi-plus" />
              </button>
            </div>
          </div>
          <span class="pos-cart__item-total">{{ formatCurrencySafe(item.priceAtOrder * item.quantity)
          }}</span>
        </div>
      </section>
      <EmptyState
        v-else
        title="Giỏ hàng trống"
        message="Giỏ hàng đang trống. Vui lòng chọn sản phẩm."
      >
        <template #icon>
          <i class="bi bi-basket" />
        </template>
      </EmptyState>

      <section class="pos-cart__customer">
        <div class="pos-cart__customer-header">
          <h6 class="pos-cart__customer-title">
            Khách hàng
          </h6>
          <button
            v-if="hasSelectedCustomer"
            type="button"
            class="pos-cart__customer-clear"
            @click="clearSelectedCustomer"
          >
            Bỏ chọn
          </button>
        </div>

        <template v-if="hasSelectedCustomer">
          <div class="pos-cart__customer-chip">
            <div>
              <div class="fw-semibold">
                {{ selectedCustomerName }}
              </div>
              <small class="text-muted">
                {{ selectedCustomerPhone || 'Không có số điện thoại' }}
              </small>
            </div>
          </div>
        </template>
        <template v-else>
          <div class="input-group">
            <input
              v-model.trim="customerSearchTerm"
              type="text"
              class="form-control"
              placeholder="Nhập tên hoặc SĐT khách hàng"
              @input="handleCustomerSearchInput"
              @keyup.enter.prevent="triggerCustomerSearch"
            >
          </div>
          <ul
            v-if="showCustomerSuggestions"
            class="pos-cart__customer-results"
          >
            <li
              v-for="customer in customerSearchResults"
              :key="customer.id || customer.customerId"
              class="pos-cart__customer-item"
              @click="selectCustomer(customer)"
            >
              <div class="pos-cart__customer-item-name">
                {{ customer.fullName || customer.customerName || customer.name }}
              </div>
              <small class="pos-cart__customer-item-phone">{{ customer.phone || customer.customerPhone ||
                '—' }}</small>
            </li>
            <li
              v-if="!customerSearchResults.length"
              class="pos-cart__customer-item pos-cart__customer-item--empty"
            >
              Không tìm thấy khách phù hợp.
            </li>
          </ul>
          <small class="pos-cart__customer-hint">Chọn khách để tích điểm và hiển thị trên hóa đơn.</small>
        </template>
      </section>

      <section class="pos-cart__summary">
        <div
          v-if="showSubTotal"
          class="pos-cart__summary-row"
        >
          <span>Tổng phụ</span>
          <span>{{ formatCurrencySafe(subTotal) }}</span>
        </div>
        <div
          v-if="showDiscountRow"
          class="pos-cart__summary-row"
        >
          <span>Giảm giá</span>
          <span>-{{ formatCurrencySafe(discountAmount) }}</span>
        </div>
        <div
          v-if="showTipRow"
          class="pos-cart__summary-row"
        >
          <span class="text-success">Tiền típ</span>
          <span class="text-success">+{{ formatCurrencySafe(tipAmount) }}</span>
        </div>
        <div class="pos-cart__summary-divider" />
        <div class="pos-cart__summary-row pos-cart__summary-row--total">
          <span>Tổng cộng</span>
          <span>{{ formatCurrencySafe(totalAmount) }}</span>
        </div>
      </section>

      <section class="pos-cart__voucher">
        <template v-if="hasVoucherApplied">
          <div class="pos-cart__voucher-applied">
            <div class="pos-cart__voucher-applied-content">
              <strong>Voucher đã áp dụng:</strong> {{ localOrder.voucherCode }}
            </div>
            <button
              class="btn btn-sm btn-outline-danger"
              type="button"
              :disabled="isProcessing('remove-voucher')"
              @click="removeVoucher"
            >
              <span
                v-if="isProcessing('remove-voucher')"
                class="spinner-border spinner-border-sm me-2"
              />
              Bỏ voucher
            </button>
          </div>
        </template>
        <div v-else>
          <div class="input-group mb-2">
            <span class="input-group-text voucher-input-icon">
              <i class="bi bi-ticket-perforated" />
            </span>
            <input
              v-model.trim="voucherCode"
              type="text"
              class="form-control"
              placeholder="Nhập mã voucher và nhấn Áp dụng"
              :disabled="!isExistingOrder || isProcessing('apply-voucher')"
              @keyup.enter="applyVoucher"
            >
            <button
              v-if="isProcessing('apply-voucher')"
              class="btn btn-warning"
              type="button"
              disabled
            >
              <span class="spinner-border spinner-border-sm me-1" />
              Đang xử lý...
            </button>
            <button
              v-else
              class="btn btn-outline-primary"
              type="button"
              :disabled="!canApplyVoucher"
              @click="applyVoucher"
            >
              <i class="bi bi-check-circle me-1" />
              Áp dụng
            </button>
          </div>
          <div
            v-if="voucherError"
            class="pos-cart__voucher-error mt-2"
          >
            <i class="bi bi-exclamation-triangle-fill me-1" />
            {{ voucherError }}
          </div>
          <small
            v-if="!isExistingOrder"
            class="pos-cart__voucher-hint"
          >Lưu đơn hàng trước khi áp dụng
            voucher.</small>
        </div>
      </section>

      <section class="pos-cart__actions">
        <button
          class="btn btn-success btn-lg pos-cart__payment-btn"
          type="button"
          :disabled="!canProcessPayment"
          @click="processPayment"
        >
          <span
            v-if="isProcessing('pay')"
            class="spinner-border spinner-border-sm me-2"
          />
          <i
            v-else
            class="bi bi-credit-card me-2"
          />
          Thanh toán
        </button>
        <button
          class="btn btn-primary pos-cart__save-btn"
          type="button"
          :disabled="isProcessing('save') || cartIsEmpty"
          @click="saveOrder"
        >
          <span
            v-if="isProcessing('save')"
            class="spinner-border spinner-border-sm"
          />
          <i
            v-else
            class="bi bi-save"
          />
          Lưu đơn hàng
        </button>
        <button
          class="btn btn-outline-danger"
          type="button"
          :disabled="isProcessing('cancel')"
          @click="cancelOrder"
        >
          <span
            v-if="isProcessing('cancel')"
            class="spinner-border spinner-border-sm"
          />
          <i
            v-else
            class="bi bi-x-circle"
          />
          {{ isExistingOrder ? 'Hủy đơn hàng' : 'Hủy tạo mới' }}
        </button>
      </section>
    </template>
  </div>

  <PosPaymentModal
    ref="paymentModalRef"
    :order="localOrder"
    :table="props.table"
    :processing="loadingAction === 'pay'"
    :show-payment-result="isSuccessModalVisible"
    @confirm-payment="confirmPayment"
    @closed="handlePaymentModalClosed"
  />

  <PaymentSuccessModal
    :visible="isSuccessModalVisible"
    :order-id="completedOrder?.id"
    @close="handleSuccessModalClose"
    @view-details="handleSuccessModalViewDetails"
  />

  <!-- Order Detail Modal -->
  <OrderDetailModal
    ref="orderDetailModalRef"
    :order-id="selectedOrderId"
  />

  <!-- Cancel Order Confirmation Modal -->
  <Teleport to="body">
    <div
      v-if="showCancelConfirm"
      class="modal fade show"
      style="display: block;"
      tabindex="-1"
      @click.self="showCancelConfirm = false"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              Xác nhận hủy đơn hàng
            </h5>
            <button
              type="button"
              class="btn-close"
              aria-label="Đóng"
              @click="showCancelConfirm = false"
            />
          </div>
          <div class="modal-body">
            <p class="mb-3">
              Bạn có chắc chắn muốn hủy đơn hàng này không?
            </p>
            <div
              v-if="localOrder.id || localOrder.code"
              class="alert alert-warning"
            >
              <i class="bi bi-exclamation-triangle me-2" />
              <strong>Mã đơn:</strong> #{{ localOrder.code || localOrder.id }}
              <br>
              <strong>Tổng tiền:</strong> {{ formatCurrencySafe(totalAmount) }}
              <br>
              Hành động này không thể hoàn tác.
            </div>
            <div
              v-else
              class="alert alert-info"
            >
              <i class="bi bi-info-circle me-2" />
              Đơn hàng chưa được lưu. Tất cả sản phẩm trong giỏ sẽ bị xóa.
            </div>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-outline-secondary"
              :disabled="isProcessing('cancel')"
              @click="showCancelConfirm = false"
            >
              Hủy
            </button>
            <button
              type="button"
              class="btn btn-danger"
              :disabled="isProcessing('cancel')"
              @click="confirmCancelOrder"
            >
              <span
                v-if="isProcessing('cancel')"
                class="spinner-border spinner-border-sm me-2"
              />
              <i
                v-else
                class="bi bi-x-circle me-2"
              />
              Xác nhận hủy
            </button>
          </div>
        </div>
      </div>
      <div
        class="modal-backdrop fade show"
        @click="showCancelConfirm = false"
      />
    </div>
  </Teleport>

  <!-- Order Cart Drawer -->
  <Teleport to="body">
    <div
      v-if="drawerOpen"
      class="order-cart-drawer-backdrop"
      @click="closeDrawer"
      @keydown.esc="closeDrawer"
    >
      <div
        class="order-cart-drawer"
        :class="{ 'order-cart-drawer--open': drawerOpen }"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        aria-describedby="drawer-description"
        tabindex="-1"
        @click.stop
      >
        <!-- Drawer Header -->
        <header class="order-cart-drawer__header">
          <div class="order-cart-drawer__header-left">
            <h5
              id="drawer-title"
              class="order-cart-drawer__title"
            >
              <i
                class="bi bi-cart me-2"
                aria-hidden="true"
              />
              Giỏ hàng
              <span
                class="badge bg-primary ms-2"
                aria-label="Số lượng sản phẩm"
              >{{ cartItemCount
              }}</span>
            </h5>
            <p
              id="drawer-description"
              class="visually-hidden"
            >
              Danh sách sản phẩm trong giỏ hàng. Sử dụng phím Tab để điều hướng, Escape để đóng.
            </p>
            <div class="order-cart-drawer__total-badge">
              {{ formatCurrencySafe(totalAmount) }}
            </div>
            <!-- Voucher Progress Bar -->
            <div
              v-if="hasVoucherApplied && localOrder.voucherCode"
              class="order-cart-drawer__voucher-progress"
            >
              <div class="order-cart-drawer__voucher-progress-label">
                <i class="bi bi-ticket-perforated me-1" />
                Voucher: {{ localOrder.voucherCode }}
              </div>
              <div class="order-cart-drawer__voucher-progress-bar">
                <div
                  class="order-cart-drawer__voucher-progress-fill"
                  :style="{ width: '100%' }"
                />
              </div>
              <small class="order-cart-drawer__voucher-progress-text text-success">
                Đã áp dụng: -{{ formatCurrencySafe(discountAmount) }}
              </small>
            </div>
          </div>
          <button
            class="btn btn-sm btn-outline-secondary order-cart-drawer__close-btn"
            type="button"
            aria-label="Đóng giỏ hàng"
            @click="closeDrawer"
          >
            <i class="bi bi-x-lg" />
          </button>
        </header>

        <!-- Drawer Body -->
        <div class="order-cart-drawer__body">
          <!-- Search and Filters -->
          <div
            v-if="cartItemCount > 3"
            class="order-cart-drawer__toolbar"
          >
            <div class="input-group mb-3">
              <span class="input-group-text">
                <i class="bi bi-search" />
              </span>
              <input
                v-model.trim="drawerSearchQuery"
                type="text"
                class="form-control"
                placeholder="Tìm kiếm sản phẩm..."
                aria-label="Tìm kiếm sản phẩm trong giỏ hàng"
                autocomplete="off"
                @input="handleDrawerSearch"
              >
            </div>
            <div class="d-flex gap-2 flex-wrap">
              <select
                v-model="drawerSortBy"
                class="form-select form-select-sm"
                aria-label="Sắp xếp sản phẩm"
                @change="handleDrawerSort"
              >
                <option value="newest">
                  Mới nhất
                </option>
                <option value="price-asc">
                  Giá: Tăng dần
                </option>
                <option value="price-desc">
                  Giá: Giảm dần
                </option>
                <option value="name-asc">
                  Tên: A-Z
                </option>
                <option value="name-desc">
                  Tên: Z-A
                </option>
              </select>
              <select
                v-if="drawerCategories.length > 0"
                v-model="drawerCategoryFilter"
                class="form-select form-select-sm"
                aria-label="Lọc theo danh mục"
                @change="handleDrawerFilter"
              >
                <option value="">
                  Tất cả danh mục
                </option>
                <option
                  v-for="cat in drawerCategories"
                  :key="cat.id"
                  :value="cat.id"
                >
                  {{ cat.name }}
                </option>
              </select>
              <button
                v-if="cartItemCount > 1"
                class="btn btn-sm btn-outline-danger"
                type="button"
                @click="handleClearAll"
              >
                <i class="bi bi-trash me-1" />
                Xóa tất cả
              </button>
            </div>
          </div>

          <!-- Loading State -->
          <div
            v-if="drawerLoading"
            class="order-cart-drawer__loading"
          >
            <div
              class="spinner-border text-primary"
              role="status"
            >
              <span class="visually-hidden">Đang tải...</span>
            </div>
            <p class="mt-3 text-muted">
              Đang tải sản phẩm...
            </p>
          </div>

          <!-- Empty State -->
          <EmptyState
            v-else-if="filteredDrawerItems.length === 0"
            :title="drawerSearchQueryDebounced || drawerCategoryFilter ? 'Không tìm thấy sản phẩm' : 'Giỏ hàng trống'"
            :message="drawerSearchQueryDebounced || drawerCategoryFilter ? 'Thử tìm kiếm với từ khóa khác' : 'Chưa có sản phẩm nào trong giỏ hàng'"
          >
            <template #icon>
              <i class="bi bi-basket" />
            </template>
            <template #action>
              <button
                v-if="!drawerSearchQueryDebounced && !drawerCategoryFilter"
                class="btn btn-primary"
                @click="closeDrawer"
              >
                Thêm sản phẩm
              </button>
            </template>
          </EmptyState>

          <!-- Product List -->
          <div
            v-else
            class="order-cart-drawer__items"
          >
            <div
              v-for="(item, index) in filteredDrawerItems"
              :key="item.id || item.productId || index"
              class="order-cart-drawer__item"
            >
              <div class="order-cart-drawer__item-image">
                <img
                  v-if="item.productImage"
                  :src="item.productImage"
                  :alt="item.productName"
                  loading="lazy"
                >
                <div
                  v-else
                  class="order-cart-drawer__item-placeholder"
                >
                  <i class="bi bi-image" />
                </div>
              </div>
              <div class="order-cart-drawer__item-info">
                <h6 class="order-cart-drawer__item-name">
                  {{ item.productName }}
                </h6>
                <p class="order-cart-drawer__item-price">
                  {{ formatCurrencySafe(item.priceAtOrder) }} × {{ item.quantity }}
                </p>
                <!-- Ghi chú cho món trong drawer -->
                <div class="order-cart-drawer__item-notes-section">
                  <div
                    v-if="editingNotesIndex !== getDrawerItemRealIndex(item)"
                    class="order-cart-drawer__item-notes-display"
                  >
                    <small
                      v-if="item.notes"
                      class="order-cart-drawer__item-notes"
                    >
                      <i class="bi bi-sticky me-1" />{{ item.notes }}
                    </small>
                    <button
                      class="btn btn-sm btn-link p-0 text-muted order-cart-drawer__item-notes-edit-btn"
                      type="button"
                      :disabled="isProcessing('quantity')"
                      title="Chỉnh sửa ghi chú"
                      @click="startEditNotesForDrawerItem(item)"
                    >
                      <i
                        :class="item.notes ? 'bi bi-pencil' : 'bi bi-plus-circle'"
                      />
                      {{ item.notes ? 'Sửa' : 'Thêm ghi chú' }}
                    </button>
                  </div>
                  <div
                    v-else
                    class="order-cart-drawer__item-notes-edit"
                  >
                    <input
                      v-model="editingNotesValue"
                      type="text"
                      class="form-control form-control-sm"
                      placeholder="Nhập ghi chú cho món này..."
                      :disabled="isProcessing('quantity')"
                      @keyup.enter="saveItemNotesForDrawerItem(item)"
                      @keyup.esc="cancelEditNotes"
                      @blur="saveItemNotesForDrawerItem(item)"
                    >
                    <div class="order-cart-drawer__item-notes-edit-actions">
                      <button
                        class="btn btn-sm btn-success"
                        type="button"
                        :disabled="isProcessing('quantity')"
                        @click="saveItemNotesForDrawerItem(item)"
                      >
                        <i class="bi bi-check" />
                      </button>
                      <button
                        class="btn btn-sm btn-outline-secondary"
                        type="button"
                        :disabled="isProcessing('quantity')"
                        @click="cancelEditNotes"
                      >
                        <i class="bi bi-x" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div class="order-cart-drawer__item-actions">
                <div class="quantity-controls">
                  <button
                    class="btn btn-sm btn-outline-secondary"
                    type="button"
                    :disabled="isProcessing('quantity')"
                    :aria-label="`Giảm số lượng ${item.productName}`"
                    @click="updateQuantityForDrawerItem(item, -1)"
                  >
                    <i
                      class="bi bi-dash"
                      aria-hidden="true"
                    />
                  </button>
                  <input
                    type="number"
                    class="quantity-input"
                    :value="item.quantity"
                    min="1"
                    :disabled="isProcessing('quantity')"
                    :aria-label="`Số lượng ${item.productName}`"
                    @input="setQuantityForDrawerItem(item, $event.target.value)"
                    @change="setQuantityForDrawerItem(item, item.quantity)"
                  >
                  <button
                    class="btn btn-sm btn-outline-secondary"
                    type="button"
                    :disabled="isProcessing('quantity')"
                    :aria-label="`Tăng số lượng ${item.productName}`"
                    @click="updateQuantityForDrawerItem(item, 1)"
                  >
                    <i
                      class="bi bi-plus"
                      aria-hidden="true"
                    />
                  </button>
                </div>
                <button
                  class="btn btn-sm btn-outline-danger"
                  type="button"
                  :disabled="isProcessing('quantity')"
                  :aria-label="`Xóa ${item.productName} khỏi giỏ hàng`"
                  @click="removeDrawerItem(item)"
                >
                  <i
                    class="bi bi-trash"
                    aria-hidden="true"
                  />
                </button>
              </div>
              <div class="order-cart-drawer__item-total">
                {{ formatCurrencySafe(item.priceAtOrder * item.quantity) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Drawer Footer -->
        <footer class="order-cart-drawer__footer">
          <div class="order-cart-drawer__summary">
            <div class="order-cart-drawer__summary-row">
              <span>Tổng phụ</span>
              <span>{{ formatCurrencySafe(subTotal) }}</span>
            </div>
            <div
              v-if="showDiscountRow"
              class="order-cart-drawer__summary-row"
            >
              <span>Giảm giá</span>
              <span class="text-danger">-{{ formatCurrencySafe(discountAmount) }}</span>
            </div>
            <div
              v-if="showTipRow"
              class="order-cart-drawer__summary-row"
            >
              <span class="text-success">Tiền típ</span>
              <span class="text-success">+{{ formatCurrencySafe(tipAmount) }}</span>
            </div>
            <div class="order-cart-drawer__summary-divider" />
            <div class="order-cart-drawer__summary-row order-cart-drawer__summary-row--total">
              <span>Tổng cộng</span>
              <span>{{ formatCurrencySafe(totalAmount) }}</span>
            </div>
          </div>
          <div class="order-cart-drawer__actions">
            <button
              class="btn btn-success btn-lg w-100"
              type="button"
              :disabled="!canProcessPayment"
              @click="handleDrawerPayment"
            >
              <span
                v-if="isProcessing('pay')"
                class="spinner-border spinner-border-sm"
              />
              <i
                v-else
                class="bi bi-credit-card"
              />
              Thanh toán
            </button>
            <button
              class="btn btn-outline-primary w-100"
              type="button"
              :disabled="isProcessing('save') || cartIsEmpty"
              @click="handleDrawerSave"
            >
              <span
                v-if="isProcessing('save')"
                class="spinner-border spinner-border-sm"
              />
              <i
                v-else
                class="bi bi-save"
              />
              Lưu đơn hàng
            </button>
          </div>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch, computed, onBeforeUnmount, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import * as orderService from '@/api/orderService.js'
import { searchCustomers } from '@/api/customerService.js'
import { formatCurrency } from '@/utils/formatters.js'
import { toast } from 'vue3-toastify'
import logger from '@/utils/logger'
import PosPaymentModal from './PosPaymentModal.vue'
import PaymentSuccessModal from '@/components/pos/PaymentSuccessModal.vue'
import OrderDetailModal from '@/components/orders/OrderDetailModal.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { useDraftOrder, removeDraftFromStorage } from '@/composables/useDraftOrder'

const props = defineProps({
    table: Object,
    order: Object,
    viewIntent: {
        type: String,
        default: 'table-first'
    }
})

const emit = defineEmits(['order-updated', 'create-new-takeaway', 'request-table-selection'])

const localOrder = ref({
    items: [],
    customerId: null,
    customerName: null,
    customerPhone: null,
    customerEmail: null
})
const originalOrderSnapshot = ref(null)
const isCreatingNew = ref(false)

// Sử dụng useDraftOrder để auto-save draft
const { saveDraft, syncDraftToServer } = useDraftOrder(localOrder, {
    autoSave: true,
    debounceMs: 2000
})
const voucherCode = ref('')
const voucherError = ref(null)
const loadingAction = ref(null)
const editingNotesIndex = ref(null)
const editingNotesValue = ref('')

// State cho drawer
const drawerOpen = ref(false)
const drawerSearchQuery = ref('')
const drawerSearchQueryDebounced = ref('')
const drawerSortBy = ref('newest')
const drawerCategoryFilter = ref('')
const drawerLoading = ref(false)
let drawerSearchTimeout = null
const paymentModalRef = ref(null)
const paymentResultModalRef = ref(null)
const orderDetailModalRef = ref(null)

// Hàm đóng tất cả modal để đảm bảo chỉ có 1 modal mở tại một thời điểm
const closeAllModals = async () => {
    // Đóng tất cả modal refs
    if (paymentModalRef.value) {
        paymentModalRef.value.hide()
    }
    if (paymentResultModalRef.value) {
        paymentResultModalRef.value.hide()
    }
    if (orderDetailModalRef.value) {
        orderDetailModalRef.value.hide()
    }

    // Đóng tất cả modal Bootstrap còn sót lại (phòng trường hợp)
    try {
        // eslint-disable-next-line no-undef
        if (typeof bootstrap !== 'undefined' && bootstrap?.Modal) {
            const openModals = document.querySelectorAll('.modal.show')
            openModals.forEach(modalElement => {
                const bsModal = bootstrap.Modal.getInstance(modalElement)
                if (bsModal) {
                    bsModal.hide()
                }
            })
        }
    } catch (error) {
        // Ignore error if bootstrap is not available
        logger.warn('Bootstrap Modal not available:', error)
    }

    // Đợi tất cả modal đóng hoàn toàn (Bootstrap modal có transition 300ms)
    await new Promise(resolve => setTimeout(resolve, 350))

    // Cleanup backdrop
    cleanupAllBackdrops()
}

// Cleanup tất cả backdrop còn sót lại
const cleanupAllBackdrops = () => {
    const backdrops = document.querySelectorAll('.modal-backdrop')
    backdrops.forEach(backdrop => {
        backdrop.remove()
    })

    // Xóa class modal-open khỏi body
    document.body.classList.remove('modal-open')
    document.body.style.overflow = ''
    document.body.style.paddingRight = ''
}

// New state for success modal
const isSuccessModalVisible = ref(false)
const completedOrder = ref(null)

const selectedOrderId = ref(null)
const showCancelConfirm = ref(false)
const router = useRouter()

const customerSearchTerm = ref('')
const customerSearchResults = ref([])
const customerSearchLoading = ref(false)
let customerSearchTimeout = null

const STATUS_METADATA = Object.freeze({
    PENDING: { label: 'Đang chờ', class: 'status-pill--pending' },
    PAID: { label: 'Đã thanh toán', class: 'status-pill--paid' },
    CANCELLED: { label: 'Đã hủy', class: 'status-pill--cancelled' },
    TRANSFERRED: { label: 'Đã chuyển ca', class: 'status-pill--transferred' }
})

const toNumberSafe = (value, fallback = 0) => {
    const numeric = Number(value)
    return Number.isFinite(numeric) ? numeric : fallback
}

const normalizeItems = (orderLike) => {
    if (!orderLike) return []

    const base = Array.isArray(orderLike.items) && orderLike.items.length
        ? orderLike.items
        : Array.isArray(orderLike.orderDetails)
            ? orderLike.orderDetails
            : []

    return base.map((detail) => ({
        id: detail.id,
        orderDetailId: detail.id,
        productId: detail.productId ?? detail.product?.id ?? detail.id,
        productName: detail.productName ?? detail.product?.name ?? detail.name ?? 'Sản phẩm',
        productImage: detail.productImage ?? detail.product?.image ?? detail.product?.imageUrl ?? null,
        categoryId: detail.categoryId ?? detail.product?.categoryId ?? detail.category?.id ?? null,
        categoryName: detail.categoryName ?? detail.product?.categoryName ?? detail.category?.name ?? null,
        quantity: toNumberSafe(detail.quantity ?? detail.qty ?? 0),
        priceAtOrder: toNumberSafe(detail.priceAtOrder ?? detail.price ?? detail.unitPrice ?? 0),
        notes: detail.notes ?? ''
    }))
}

const cloneDeep = (value) => {
    try {
        return structuredClone(value)
    } catch {
        return JSON.parse(JSON.stringify(value))
    }
}

const normalizeOrder = (incoming) => {
    if (!incoming) return { items: [] }
    const cloned = cloneDeep(incoming)
    cloned.items = normalizeItems(cloned)
    const customerId = cloned.customerId ?? cloned.customer?.id ?? null
    const customerName = cloned.customerName ?? cloned.customer?.fullName ?? cloned.customer?.name ?? null
    const customerPhone = cloned.customerPhone ?? cloned.customer?.phone ?? null
    const customerEmail = cloned.customerEmail ?? cloned.customer?.email ?? null
    Object.assign(cloned, {
        customerId,
        customerName,
        customerPhone,
        customerEmail
    })
    return cloned
}

const emitOrderUpdated = (reason, order = localOrder.value) => {
    emit('order-updated', {
        reason,
        order: cloneDeep(order)
    })
}

const updateLocalOrderFromServer = (order, { syncBaseline = false } = {}) => {
    if (!order) {
        localOrder.value = {
            items: [],
            customerId: null,
            customerName: null,
            customerPhone: null,
            customerEmail: null
        }
        if (syncBaseline) {
            originalOrderSnapshot.value = null
        }
        return
    }
    const normalized = normalizeOrder(order)
    localOrder.value = normalized
    if (syncBaseline) {
        originalOrderSnapshot.value = cloneDeep(normalized)
    }
}

watch(() => props.order, (newOrder) => {
    if (newOrder) {
        updateLocalOrderFromServer(newOrder, { syncBaseline: true })
        isCreatingNew.value = false
    } else {
        localOrder.value = { items: [] }
        originalOrderSnapshot.value = null
    }
}, { immediate: true })

const cartTitle = computed(() => {
    if (props.table) {
        return `Đơn tại bàn: ${props.table.name}`
    }

    if (props.viewIntent === 'takeaway') {
        if (localOrder.value?.code || localOrder.value?.id) {
            return `Đơn mang đi: #${localOrder.value.code || localOrder.value.id}`
        }
        return 'Đơn mang đi (chưa lưu)'
    }

    if (props.viewIntent === 'product-first') {
        return localOrder.value?.id ? 'Đơn nháp đã lưu' : 'Đơn nháp (chờ gán bàn)'
    }

    return 'Đơn hàng POS'
})

const orderStatusMeta = computed(() => {
    const status = localOrder.value.status
    if (status) {
        return STATUS_METADATA[status] || { label: status, class: 'status-pill--default' }
    }

    if (props.viewIntent === 'takeaway') {
        return localOrder.value?.id
            ? { label: 'Mang đi • Đang xử lý', class: 'status-pill--takeaway' }
            : { label: 'Mang đi • Đang tạo', class: 'status-pill--draft' }
    }

    if (!props.table) {
        return isCreatingNew.value
            ? { label: 'Đang tạo đơn', class: 'status-pill--draft' }
            : { label: 'Chưa gán bàn', class: 'status-pill--default' }
    }

    if (isCreatingNew.value) {
        return { label: 'Đang tạo', class: 'status-pill--draft' }
    }

    return { label: 'Không xác định', class: 'status-pill--default' }
})

const orderStatusLabel = computed(() => orderStatusMeta.value.label)
const orderStatusClass = computed(() => orderStatusMeta.value.class)

// Helper functions cho customization labels
const getIceLabel = (ice) => {
    const labels = {
        normal: 'Đá bình thường',
        less: 'Ít đá',
        no: 'Không đá',
        extra: 'Nhiều đá'
    }
    return labels[ice] || ice
}

const getSugarLabel = (sugar) => {
    const labels = {
        normal: 'Đường bình thường',
        less: 'Ít đường',
        no: 'Không đường',
        extra: 'Nhiều đường'
    }
    return labels[sugar] || sugar
}

const formatCurrencySafe = (value) => {
    const numeric = Number(value)
    if (!Number.isFinite(numeric)) return '—'
    return formatCurrency(numeric)
}

const subTotal = computed(() => {
    // Luôn tính từ local items để cập nhật real-time
    const items = Array.isArray(localOrder.value.items) ? localOrder.value.items : []
    const calculated = items.reduce((acc, item) => {
        const price = Number(item.priceAtOrder) || 0
        const qty = Number(item.quantity) || 0
        return acc + (price * qty)
    }, 0)

    // Chỉ dùng giá trị backend nếu không có local items (cho lần load đầu tiên)
    if (items.length === 0) {
        const backendSubTotal = localOrder.value.subTotal
        if (Number.isFinite(backendSubTotal)) {
            return backendSubTotal
        }
    }

    return calculated
})

const discountAmount = computed(() => {
    const discount = Number(localOrder.value.discountAmount)
    return Number.isFinite(discount) ? Math.max(discount, 0) : 0
})

const tipAmount = computed(() => {
    const tip = Number(localOrder.value.tipAmount)
    return Number.isFinite(tip) ? Math.max(tip, 0) : 0
})

const totalAmount = computed(() => {
    // Luôn tính từ local items để cập nhật real-time
    const items = Array.isArray(localOrder.value.items) ? localOrder.value.items : []

    // Nếu có local items, luôn tính từ chúng
    if (items.length > 0) {
        const amountAfterDiscount = Math.max(subTotal.value - discountAmount.value, 0)
        return Math.max(amountAfterDiscount + tipAmount.value, 0)
    }

    // Chỉ dùng giá trị backend nếu không có local items (cho lần load đầu tiên)
    const backendTotal = Number(localOrder.value.totalAmount)
    if (Number.isFinite(backendTotal)) {
        return Math.max(backendTotal, 0)
    }

    const amountAfterDiscount = Math.max(subTotal.value - discountAmount.value, 0)
    return Math.max(amountAfterDiscount + tipAmount.value, 0)
})

const hasVoucherApplied = computed(() => Boolean(localOrder.value.voucherCode))
const isExistingOrder = computed(() => Boolean(localOrder.value?.id))
const cartIsEmpty = computed(() => {
    const items = localOrder.value.items
    return !Array.isArray(items) || items.length === 0
})
const showDiscountRow = computed(() => discountAmount.value > 0)
const showTipRow = computed(() => tipAmount.value > 0)

const showSubTotal = computed(() =>
    // Chỉ hiển thị "Tổng phụ" nếu khác "Tổng cộng" (có giảm giá, tip, hoặc thuế)
    showDiscountRow.value || showTipRow.value || Math.abs(subTotal.value - totalAmount.value) > 0.01
)

const showSelectTableButton = computed(() => !props.table && props.viewIntent !== 'takeaway' && !cartIsEmpty.value)

const trimmedVoucherCode = computed(() => voucherCode.value.trim().toUpperCase())
const canApplyVoucher = computed(() => isExistingOrder.value && Boolean(trimmedVoucherCode.value) && !isProcessing('apply-voucher'))
const canProcessPayment = computed(() => isExistingOrder.value && !cartIsEmpty.value && !isProcessing('pay'))

// Computed cho drawer
const cartItemCount = computed(() => localOrder.value?.items?.length || 0)
const showExpandButton = computed(() => cartItemCount.value > 3 || (localOrder.value?.items && localOrder.value.items.length > 0))

const drawerCategories = computed(() => {
    if (!localOrder.value?.items) return []
    const categoryMap = new Map()
    localOrder.value.items.forEach(item => {
        if (item.categoryId && item.categoryName) {
            if (!categoryMap.has(item.categoryId)) {
                categoryMap.set(item.categoryId, {
                    id: item.categoryId,
                    name: item.categoryName
                })
            }
        }
    })
    return Array.from(categoryMap.values())
})

const filteredDrawerItems = computed(() => {
    if (!localOrder.value?.items) return []
    let items = [...localOrder.value.items]

    // Lọc theo từ khóa tìm kiếm (sử dụng giá trị debounced)
    if (drawerSearchQueryDebounced.value) {
        const query = drawerSearchQueryDebounced.value.toLowerCase()
        items = items.filter(item =>
            item.productName?.toLowerCase().includes(query) ||
			item.notes?.toLowerCase().includes(query)
        )
    }

    // Lọc theo danh mục
    if (drawerCategoryFilter.value) {
        items = items.filter(item => item.categoryId === drawerCategoryFilter.value)
    }

    // Sort
    switch (drawerSortBy.value) {
        case 'price-asc':
            items.sort((a, b) => (a.priceAtOrder || 0) - (b.priceAtOrder || 0))
            break
        case 'price-desc':
            items.sort((a, b) => (b.priceAtOrder || 0) - (a.priceAtOrder || 0))
            break
        case 'name-asc':
            items.sort((a, b) => (a.productName || '').localeCompare(b.productName || ''))
            break
        case 'name-desc':
            items.sort((a, b) => (b.productName || '').localeCompare(a.productName || ''))
            break
        case 'newest':
        default:
            // Giữ nguyên thứ tự ban đầu (mới nhất trước)
            break
    }

    return items
})

const hasSelectedCustomer = computed(() => Boolean(localOrder.value.customerId))
const selectedCustomerName = computed(() => localOrder.value.customerName || 'Khách lẻ')
const selectedCustomerPhone = computed(() => localOrder.value.customerPhone || '')
const showCustomerSuggestions = computed(() => customerSearchTerm.value && !hasSelectedCustomer.value)



const createNewOrder = () => {
    isCreatingNew.value = true
    if (!props.table) {
        emit('create-new-takeaway')
    }
}

const addProduct = (product) => {
    if (!isCreatingNew.value && !props.order) {
        createNewOrder()
    }

    // Xử lý customization nếu có
    const finalPrice = product.customization?.finalPrice || product.price
    const notes = product.customization?.notes || product.notes || ''
    const customization = product.customization ? {
        size: product.customization.size,
        ice: product.customization.ice,
        sugar: product.customization.sugar
    } : null

    // Tìm item có cùng productId và customization (nếu có)
    const existingItem = localOrder.value.items.find(item => {
        if (item.productId !== product.id) return false
        // Nếu có customization, phải khớp hoàn toàn
        if (customization) {
            return JSON.stringify(item.customization) === JSON.stringify(customization)
        }
        // Nếu không có customization, chỉ cần productId khớp
        return !item.customization
    })

    if (existingItem) {
        existingItem.quantity++
    } else {
        localOrder.value.items.push({
            productId: product.id,
            productName: product.name,
            quantity: 1,
            priceAtOrder: finalPrice, // Dùng giá đã customize
            notes: notes,
            customization: customization // Lưu customization để hiển thị sau
        })
    }
    
    // Buộc cập nhật reactivity
    localOrder.value = { ...localOrder.value }
}

const updateQuantity = (index, change) => {
    const newQuantity = localOrder.value.items[index].quantity + change
    if (newQuantity <= 0) {
        removeItem(index)
    } else {
        // Cập nhật số lượng ngay lập tức để tính toán real-time
        localOrder.value.items[index].quantity = newQuantity
        // Buộc cập nhật reactivity
        localOrder.value = { ...localOrder.value }
    }
}

const setQuantity = (index, value) => {
    const numValue = parseInt(value, 10)
    if (Number.isFinite(numValue) && numValue > 0) {
        // Cập nhật số lượng ngay lập tức để tính toán real-time
        localOrder.value.items[index].quantity = numValue
        // Buộc cập nhật reactivity
        localOrder.value = { ...localOrder.value }
    } else if (numValue <= 0) {
        // Xóa item nếu số lượng bằng 0 hoặc âm
        removeItem(index)
    }
}

const removeItem = (index) => {
    const item = localOrder.value.items[index]
    if (!item) return
    // Hủy chỉnh sửa nếu đang xóa item đang được chỉnh sửa
    if (editingNotesIndex.value === index) {
        cancelEditNotes()
    }
    // Xóa nhanh không cần xác nhận để UX tốt hơn trong POS
    localOrder.value.items.splice(index, 1)
    toast.info(`Đã xóa "${item.productName}" khỏi đơn hàng`, { autoClose: 2000 })
}

const startEditNotes = (index) => {
    editingNotesIndex.value = index
    editingNotesValue.value = localOrder.value.items[index]?.notes || ''
}

const saveItemNotes = (index) => {
    if (editingNotesIndex.value === index && localOrder.value.items[index]) {
        const trimmedNotes = editingNotesValue.value?.trim() || ''
        localOrder.value.items[index].notes = trimmedNotes
        // Buộc cập nhật reactivity
        localOrder.value = { ...localOrder.value }
    }
    cancelEditNotes()
}

const cancelEditNotes = () => {
    editingNotesIndex.value = null
    editingNotesValue.value = ''
}

// Các hàm helper cho drawer items
const getDrawerItemRealIndex = (item) => localOrder.value.items.findIndex(i =>
    (i.id && i.id === item.id) ||
        (i.productId === item.productId && (!i.orderDetailId || i.orderDetailId === item.orderDetailId))
)

const startEditNotesForDrawerItem = (item) => {
    const realIndex = getDrawerItemRealIndex(item)
    if (realIndex !== -1) {
        startEditNotes(realIndex)
    }
}

const saveItemNotesForDrawerItem = (item) => {
    const realIndex = getDrawerItemRealIndex(item)
    if (realIndex !== -1) {
        saveItemNotes(realIndex)
    }
}

const updateQuantityForDrawerItem = (item, change) => {
    const realIndex = getDrawerItemRealIndex(item)
    if (realIndex !== -1) {
        updateQuantity(realIndex, change)
    }
}

const setQuantityForDrawerItem = (item, value) => {
    const realIndex = getDrawerItemRealIndex(item)
    if (realIndex !== -1) {
        setQuantity(realIndex, value)
    }
}

const removeDrawerItem = (item) => {
    const realIndex = getDrawerItemRealIndex(item)
    if (realIndex !== -1) {
        removeItem(realIndex)
    }
}

const saveOrder = async () => {
    loadingAction.value = 'save'
    try {
        const orderData = {
            tableId: props.table?.id,
            type: props.table ? 'DINE_IN' : 'TAKE_AWAY',
            customerId: localOrder.value.customerId || null,
            items: localOrder.value.items.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                notes: item.notes || null,
                // Gửi customization nếu có (backend có thể cần xử lý)
                customization: item.customization || null
            }))
        }

        if (localOrder.value.id) {
            const orderId = localOrder.value.id

            // Kiểm tra order status trước khi cập nhật
            try {
                const currentOrder = await orderService.getOrderById(orderId)
                if (currentOrder.status !== 'PENDING') {
                    toast.error(`Đơn hàng đã ${currentOrder.status === 'PAID' ? 'được thanh toán' : 'bị hủy'}. Không thể cập nhật.`)
                    // Refresh order từ server
                    updateLocalOrderFromServer(currentOrder, { syncBaseline: true })
                    loadingAction.value = null
                    return
                }
            } catch (error) {
                // Nếu không lấy được order, có thể order đã bị xóa
                if (error.response?.status === 404) {
                    toast.error('Đơn hàng không tồn tại. Vui lòng tạo đơn hàng mới.')
                    localOrder.value = { items: [] }
                    originalOrderSnapshot.value = null
                    loadingAction.value = null
                    return
                }
                // Nếu là lỗi khác, tiếp tục thử cập nhật
                logger.warn('Could not verify order status, proceeding with update:', error)
            }
            const originalItems = originalOrderSnapshot.value?.items ?? []
            const currentItems = Array.isArray(localOrder.value.items) ? localOrder.value.items : []

            const originalByDetailId = new Map()
            originalItems.forEach((item) => {
                if (item.orderDetailId) {
                    originalByDetailId.set(item.orderDetailId, item)
                }
            })

            const currentByDetailId = new Map()
            const itemsToAdd = []
            for (const item of currentItems) {
                if (item.orderDetailId) {
                    currentByDetailId.set(item.orderDetailId, item)
                } else {
                    // Đảm bảo productId là number và quantity là integer
                    const productId = Number(item.productId)
                    const quantity = Math.max(1, Math.floor(toNumberSafe(item.quantity, 1)))

                    if (!Number.isFinite(productId) || productId <= 0) {
                        logger.warn('Invalid productId:', item.productId)
                        continue
                    }

                    const itemToAdd = {
                        productId,
                        quantity
                    }

                    // Chỉ thêm notes nếu có giá trị
                    const notesValue = item.notes ? String(item.notes).trim() : ''
                    if (notesValue) {
                        itemToAdd.notes = notesValue
                    }

                    itemsToAdd.push(itemToAdd)
                }
            }

            const itemsToRemove = []
            originalByDetailId.forEach((_, detailId) => {
                if (!currentByDetailId.has(detailId)) {
                    itemsToRemove.push(detailId)
                }
            })

            const itemsToUpdate = []
            currentByDetailId.forEach((item, detailId) => {
                const original = originalByDetailId.get(detailId)
                if (!original) return
                const quantityChanged = Number(item.quantity) !== Number(original.quantity)
                const notesChanged = (item.notes || '') !== (original.notes || '')
                if (quantityChanged || notesChanged) {
                    const updateData = {
                        orderDetailId: detailId,
                        quantity: Math.max(1, toNumberSafe(item.quantity, 1))
                    }

                    // Chỉ thêm notes nếu có giá trị (không gửi empty string)
                    const notesValue = item.notes ? String(item.notes).trim() : null
                    if (notesValue) {
                        updateData.notes = notesValue
                    }

                    itemsToUpdate.push(updateData)
                }
            })

            // Lưu ý: Backend không hỗ trợ order-level note, chỉ có item-level notes
            // Kiểm tra thay đổi items
            if (!itemsToAdd.length && !itemsToUpdate.length && !itemsToRemove.length) {
                toast.info('Không có thay đổi nào cần lưu.')
                loadingAction.value = null
                return
            }

            // Đảm bảo có ít nhất một item trong giỏ hàng sau khi xóa
            if (currentItems.length === 0 && itemsToRemove.length > 0) {
                toast.warning('Không thể xóa tất cả sản phẩm. Đơn hàng phải có ít nhất một sản phẩm.')
                loadingAction.value = null
                return
            }

            let lastResponse = null
            let hasError = false

            try {
                // Xóa items trước
                for (const detailId of itemsToRemove) {
                    try {
                        lastResponse = await orderService.removeItemFromOrder({ orderId, orderDetailId: detailId })
                    } catch (error) {
                        logger.error('Failed to remove item:', error)
                        hasError = true
                        toast.error(`Không thể xóa món: ${error.response?.data?.message || error.message}`)
                    }
                }

                // Cập nhật items
                for (const update of itemsToUpdate) {
                    try {
                        const updateData = {
                            quantity: update.quantity
                        }

                        // Chỉ thêm notes nếu có giá trị (không gửi empty string)
                        if (update.notes && String(update.notes).trim()) {
                            updateData.notes = String(update.notes).trim()
                        }

                        lastResponse = await orderService.updateOrderItem({
                            orderId,
                            orderDetailId: update.orderDetailId,
                            updateData
                        })
                    } catch (error) {
                        logger.error('Failed to update item:', error)
                        hasError = true
                        toast.error(`Không thể cập nhật món: ${error.response?.data?.message || error.message}`)
                    }
                }

                // Thêm items mới - thêm delay giữa các requests để tránh Hibernate orphan deletion
                for (let i = 0; i < itemsToAdd.length; i++) {
                    const addition = itemsToAdd[i]
                    let itemData = null
                    try {
                        // Thêm delay giữa các requests (trừ request đầu tiên)
                        if (i > 0) {
                            await new Promise(resolve => setTimeout(resolve, 200)) // 200ms delay
                        }

                        // Ghi log thêm món để debug
                        if (import.meta.env.DEV) {
                            logger.log('[PosOrderCart] Processing addition:', {
                                addition,
                                productIdType: typeof addition.productId,
                                quantityType: typeof addition.quantity,
                                notesType: typeof addition.notes,
                                orderId,
                                orderStatus: localOrder.value?.status,
                                index: i + 1,
                                total: itemsToAdd.length
                            })
                        }

                        // Kiểm tra order status một lần nữa trước khi thêm item
                        if (localOrder.value?.status && localOrder.value.status !== 'PENDING') {
                            throw new Error(`Đơn hàng đã ${localOrder.value.status === 'PAID' ? 'được thanh toán' : 'bị hủy'}. Không thể thêm món.`)
                        }

                        // Đảm bảo format đúng: productId là Long, quantity là int
                        const productId = Number(addition.productId)
                        const quantity = Math.max(1, Math.floor(Number(addition.quantity || 1)))

                        // Validate trước khi tạo itemData
                        if (!Number.isFinite(productId) || productId <= 0 || !Number.isInteger(productId)) {
                            throw new Error(`Product ID không hợp lệ: ${addition.productId} (phải là số nguyên dương)`)
                        }
                        if (!Number.isFinite(quantity) || quantity < 1 || !Number.isInteger(quantity)) {
                            throw new Error(`Số lượng không hợp lệ: ${addition.quantity} (phải là số nguyên >= 1)`)
                        }

                        itemData = {
                            productId,
                            quantity
                        }

                        // Chỉ thêm notes nếu có giá trị (không gửi empty string hoặc null)
                        if (addition.notes !== null && addition.notes !== undefined && String(addition.notes).trim()) {
                            itemData.notes = String(addition.notes).trim()
                        }

                        // Ghi log itemData trước khi gửi
                        if (import.meta.env.DEV) {
                            logger.log('[PosOrderCart] Đã chuẩn bị itemData:', {
                                itemData,
                                itemDataString: JSON.stringify(itemData),
                                itemDataType: {
                                    productId: typeof itemData.productId,
                                    quantity: typeof itemData.quantity,
                                    notes: typeof itemData.notes
                                }
                            })
                        }

                        // Retry logic với exponential backoff cho lỗi 500
                        let retries = 0
                        const maxRetries = 2

                        while (retries <= maxRetries) {
                            try {
                                lastResponse = await orderService.addItemToOrder({
                                    orderId,
                                    itemData
                                })

                                // Refresh order sau mỗi lần thêm thành công để đồng bộ state
                                // Điều này giúp tránh lỗi Hibernate orphan deletion khi gọi request tiếp theo
                                if (lastResponse) {
                                    updateLocalOrderFromServer(lastResponse, { syncBaseline: false })
                                }

                                // Thành công, break khỏi retry loop
                                break
                            } catch (retryError) {
                                const _lastError = retryError
                                const retryStatus = retryError.response?.status || retryError.status

                                // Chỉ retry nếu là lỗi 500 và chưa vượt quá maxRetries
                                if (retryStatus === 500 && retries < maxRetries) {
                                    retries++
                                    const delay = Math.min(300 * Math.pow(2, retries - 1), 1000) // Exponential backoff: 300ms, 600ms, max 1000ms

                                    if (import.meta.env.DEV) {
                                        logger.log(`[PosOrderCart] Retrying addItemToOrder (attempt ${retries}/${maxRetries}) after ${delay}ms delay`)
                                    }

                                    // Refresh order trước khi retry để đảm bảo state đồng bộ
                                    try {
                                        const refreshedOrder = await orderService.getOrderById(orderId)
                                        updateLocalOrderFromServer(refreshedOrder, { syncBaseline: true })
                                    } catch (refreshError) {
                                        logger.error('[PosOrderCart] Failed to refresh order before retry:', refreshError)
                                    }

                                    await new Promise(resolve => setTimeout(resolve, delay))
                                    continue
                                } else {
                                    // Không retry hoặc đã hết retries, throw error
                                    throw retryError
                                }
                            }
                        }
                    } catch (error) {
                        const errorResponse = error.response?.data || error.originalError?.response?.data
                        const errorStatus = error.response?.status || error.status || error.originalError?.response?.status

                        logger.error('[PosOrderCart] Failed to add item:', {
                            error,
                            errorMessage: error.message,
                            errorResponse,
                            errorStatus,
                            itemData: itemData || addition,
                            orderId,
                            // Ghi log chi tiết hơn
                            productId: itemData?.productId || addition?.productId,
                            quantity: itemData?.quantity || addition?.quantity
                        })
                        hasError = true

                        // Xử lý các loại lỗi cụ thể
                        let errorMessage = error.message || 'Không thể thêm món'

                        if (errorStatus === 400) {
                            errorMessage = errorResponse?.message || errorResponse?.error || 'Dữ liệu không hợp lệ'
                        } else if (errorStatus === 404) {
                            errorMessage = errorResponse?.message || errorResponse?.error || 'Đơn hàng hoặc sản phẩm không tồn tại'
                        } else if (errorStatus === 409 || errorStatus === 422) {
                            errorMessage = errorResponse?.message || errorResponse?.error || 'Đơn hàng không ở trạng thái PENDING'
                        } else if (errorStatus === 500) {
                            // Lỗi 500 có thể do nhiều nguyên nhân
                            if (errorResponse?.message) {
                                errorMessage = errorResponse.message
                            } else if (errorResponse?.error) {
                                errorMessage = errorResponse.error
                            } else {
                                errorMessage = 'Lỗi server. Có thể do: đơn hàng không ở trạng thái PENDING, sản phẩm không tồn tại hoặc không available, hoặc lỗi hệ thống.'
                            }
                        } else {
                            errorMessage = errorResponse?.message || errorResponse?.error || error.message || 'Không thể thêm món'
                        }

                        toast.error(`Không thể thêm món: ${errorMessage}`)

                        // Nếu là lỗi về order status hoặc 500, refresh order để đồng bộ
                        if (errorStatus === 409 || errorStatus === 422 || errorStatus === 500) {
                            try {
                                const refreshedOrder = await orderService.getOrderById(orderId)
                                updateLocalOrderFromServer(refreshedOrder, { syncBaseline: true })
                                logger.log('[PosOrderCart] Order refreshed after error')
                            } catch (refreshError) {
                                logger.error('[PosOrderCart] Failed to refresh order:', refreshError)
                            }
                        }
                    }
                }

                // Lưu ý: Backend không hỗ trợ order-level note
                // Ghi chú chỉ có thể lưu ở item-level (OrderDetail.notes)
                // Nếu cần order-level note, cần thêm field vào Order entity và endpoint PUT /api/v1/orders/{orderId}

                // Nếu có lỗi, vẫn cố gắng refresh order để đồng bộ
                if (hasError && lastResponse) {
                    updateLocalOrderFromServer(lastResponse, { syncBaseline: true })
                    toast.warning('Một số thay đổi không thể lưu. Vui lòng kiểm tra lại.')
                } else if (lastResponse) {
                    // Chỉ sync baseline một lần sau khi tất cả operations hoàn thành
                    updateLocalOrderFromServer(lastResponse, { syncBaseline: true })
                    toast.success('Đơn hàng đã được cập nhật.')
                } else {
                    // Nếu không có response nào, refetch order từ server
                    try {
                        const refreshedOrder = await orderService.getOrderById(orderId)
                        updateLocalOrderFromServer(refreshedOrder, { syncBaseline: true })
                        toast.success('Đơn hàng đã được cập nhật.')
                    } catch (error) {
                        logger.error('Failed to refresh order:', error)
                        toast.warning('Đơn hàng đã được cập nhật nhưng không thể tải lại dữ liệu.')
                    }
                }

                emitOrderUpdated('update', localOrder.value)
            } catch (error) {
                logger.error('Unexpected error during save:', error)
                toast.error('Lưu đơn hàng thất bại. Vui lòng thử lại.')
                // Không throw error để không làm crash app
            } finally {
                loadingAction.value = null
            }
        } else {
            // Tạo order mới
            const newOrder = await orderService.createOrder(orderData)
            updateLocalOrderFromServer(newOrder, { syncBaseline: true })
            
            // Xóa draft từ localStorage sau khi tạo order thành công
            if (localOrder.value.id && String(localOrder.value.id).startsWith('draft_')) {
                removeDraftFromStorage(localOrder.value.id)
            }

            // Lưu ý: Backend không hỗ trợ order-level note
            // Ghi chú chỉ có thể lưu ở item-level (OrderDetail.notes)
            // Nếu cần order-level note, cần thêm field vào Order entity và endpoint PUT /api/v1/orders/{orderId}

            isCreatingNew.value = false
            toast.success('Đơn hàng đã được tạo.')
            emitOrderUpdated('create', localOrder.value)
        }
    } catch (error) {
        logger.error('Unexpected error during save:', error)
        toast.error('Lưu đơn hàng thất bại. Vui lòng thử lại.')
        // Không throw error để không làm crash app
    } finally {
        loadingAction.value = null
    }
}

const applyVoucher = async () => {
    if (!localOrder.value.id) {
        voucherError.value = 'Vui lòng lưu đơn hàng trước khi áp dụng voucher.'
        toast.error('Vui lòng lưu đơn hàng trước khi áp dụng voucher.')
        return
    }
    if (!trimmedVoucherCode.value) {
        voucherError.value = 'Vui lòng nhập mã voucher'
        toast.info('Nhập mã voucher trước khi áp dụng.')
        return
    }

    try {
        loadingAction.value = 'apply-voucher'
        voucherError.value = null

        // Áp dụng voucher trực tiếp
        const updatedOrder = await orderService.applyVoucher({
            orderId: localOrder.value.id,
            voucherCode: trimmedVoucherCode.value
        })
        updateLocalOrderFromServer(updatedOrder, { syncBaseline: true })
        voucherCode.value = ''
        voucherError.value = null
        toast.success('Áp dụng voucher thành công!')
        emitOrderUpdated('voucher-applied', updatedOrder)
    } catch (error) {
        const message = error?.response?.data?.message || 'Không thể áp dụng voucher. Vui lòng kiểm tra lại mã voucher.'
        voucherError.value = message
        toast.error(message)
    } finally {
        loadingAction.value = null
    }
}

const removeVoucher = async () => {
    if (!localOrder.value.id) {
        return
    }
    try {
        loadingAction.value = 'remove-voucher'
        voucherError.value = null
        const updatedOrder = await orderService.removeVoucher(localOrder.value.id)
        updateLocalOrderFromServer(updatedOrder, { syncBaseline: true })
        voucherCode.value = ''
        voucherError.value = null
        toast.info('Đã bỏ voucher khỏi đơn hàng.')
        emitOrderUpdated('voucher-removed', updatedOrder)
    } catch (error) {
        const message = error?.response?.data?.message || 'Không thể bỏ voucher.'
        voucherError.value = message
        toast.error(message)
    } finally {
        loadingAction.value = null
    }
}

// Drawer functions
const openDrawer = () => {
    drawerOpen.value = true
    // Reset filters when opening
    drawerSearchQuery.value = ''
    drawerSearchQueryDebounced.value = ''
    drawerCategoryFilter.value = ''
    drawerSortBy.value = 'newest'
    // Prevent body scroll
    document.body.style.overflow = 'hidden'
    // Focus trap: focus vào drawer khi mở
    nextTick(() => {
        const drawer = document.querySelector('.order-cart-drawer')
        if (drawer) {
            const firstFocusable = drawer.querySelector('input, button, select, textarea, [tabindex]:not([tabindex="-1"])')
            if (firstFocusable) {
                firstFocusable.focus()
            }
        }
    })
}

const closeDrawer = () => {
    drawerOpen.value = false
    // Restore body scroll
    document.body.style.overflow = ''
}

const handleDrawerSearch = () => {
    // Debounce search query
    if (drawerSearchTimeout) {
        clearTimeout(drawerSearchTimeout)
    }
    drawerSearchTimeout = setTimeout(() => {
        drawerSearchQueryDebounced.value = drawerSearchQuery.value.trim()
    }, 300)
}

const handleDrawerSort = () => {
    // Sorting handled by computed
}

const handleDrawerFilter = () => {
    // Filtering handled by computed
}

const handleClearAll = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa tất cả sản phẩm khỏi giỏ hàng?')) {
        return
    }

    if (!localOrder.value?.items || localOrder.value.items.length === 0) {
        return
    }

    try {
        loadingAction.value = 'quantity'
        // Xóa tất cả items
        const itemsToRemove = [...localOrder.value.items]
        for (const item of itemsToRemove) {
            if (item.orderDetailId && localOrder.value.id) {
                await orderService.removeItemFromOrder({
                    orderId: localOrder.value.id,
                    orderDetailId: item.orderDetailId
                })
            }
        }
        // Clear local items
        localOrder.value.items = []
        toast.success('Đã xóa tất cả sản phẩm khỏi giỏ hàng')
        emitOrderUpdated('clear-all', localOrder.value)
    } catch (error) {
        toast.error('Không thể xóa tất cả sản phẩm')
        logger.error('Failed to clear all items:', error)
    } finally {
        loadingAction.value = null
    }
}

const handleDrawerPayment = () => {
    closeDrawer()
    processPayment()
}

const handleDrawerSave = async () => {
    await saveOrder()
    // Keep drawer open after save
}

// Handle keyboard navigation and focus trap
const handleKeydown = (event) => {
    if (!drawerOpen.value) return

    if (event.key === 'Escape') {
        closeDrawer()
        return
    }

    // Focus trap: keep focus within drawer
    if (event.key === 'Tab') {
        const drawer = document.querySelector('.order-cart-drawer')
        if (!drawer) return

        const focusableElements = drawer.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (focusableElements.length === 0) return

        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        if (event.shiftKey) {
            // Shift + Tab
            if (document.activeElement === firstElement) {
                event.preventDefault()
                lastElement.focus()
            }
        } else {
            // Tab
            if (document.activeElement === lastElement) {
                event.preventDefault()
                firstElement.focus()
            }
        }
    }
}

onMounted(() => {
    document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
    document.removeEventListener('keydown', handleKeydown)
    // Clear search timeout
    if (drawerSearchTimeout) {
        clearTimeout(drawerSearchTimeout)
    }
    // Restore body scroll
    document.body.style.overflow = ''
})

const processPayment = async () => {
    if (!localOrder.value.id) {
        toast.error('Vui lòng lưu đơn hàng trước khi thanh toán.')
        return
    }
    
    // Validation: Kiểm tra inventory lần cuối trước khi thanh toán
    try {
        loadingAction.value = 'validate'
        const items = localOrder.value.items || []
        const outOfStockItems = []
        
        // Kiểm tra từng item (có thể gọi API check inventory nếu có)
        // Tạm thời chỉ check available flag từ product data
        for (const item of items) {
            // Nếu có product data và available = false, thêm vào danh sách
            if (item.product && !item.product.available) {
                outOfStockItems.push(item.productName || item.product.name)
            }
        }
        
        if (outOfStockItems.length > 0) {
            toast.error(`Một số sản phẩm đã hết hàng: ${outOfStockItems.join(', ')}. Vui lòng xóa khỏi đơn hoặc thay thế.`)
            loadingAction.value = null
            return
        }
    } catch (error) {
        logger.warn('Inventory validation failed, proceeding anyway:', error)
        // Không block payment nếu validation fail (có thể do network)
    } finally {
        loadingAction.value = null
    }
    
    // Đóng tất cả modal khác trước khi mở payment modal
    await closeAllModals()
    paymentModalRef.value?.show()
}

const confirmPayment = async ({ orderId, paymentMethod, tipAmount: tip, customerId, voucherCode } = {}) => {
    if (!orderId) {
        toast.error('Thiếu thông tin đơn hàng để thanh toán.')
        return
    }

    try {
        loadingAction.value = 'pay'

        const paymentData = {
            paymentMethod: paymentMethod || 'CASH'
        };
        if (customerId) paymentData.customerId = customerId;
        if (tip > 0) paymentData.tipAmount = tip;
        if (voucherCode) paymentData.voucherCode = voucherCode;

        const updatedOrder = await orderService.processPayment({ orderId, paymentData });

        // Thành công
        updateLocalOrderFromServer(updatedOrder, { syncBaseline: true })
        
        // 1. Đóng modal thanh toán hiện tại
        paymentModalRef.value?.hide()
        
        // 2. Đợi animation đóng (khoảng 300-350ms)
        await new Promise(resolve => setTimeout(resolve, 350))

        // 3. Mở modal thành công
        completedOrder.value = updatedOrder
        isSuccessModalVisible.value = true

        emitOrderUpdated('payment', updatedOrder)
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Thanh toán thất bại. Vui lòng thử lại.'
        toast.error(errorMessage)
        logger.error('[PosOrderCart] Lỗi thanh toán:', {
            message: errorMessage,
            status: error?.response?.status,
            error,
        })
    } finally {
        loadingAction.value = null
    }
}

const handlePaymentModalClosed = () => {
    if (loadingAction.value === 'pay') {
        loadingAction.value = null
    }
}

// New handlers for PaymentSuccessModal
const handleSuccessModalClose = () => {
    isSuccessModalVisible.value = false
    completedOrder.value = null
    window.location.reload()
}

const handleSuccessModalViewDetails = async (orderId) => {
    if (!orderId) {
        toast.warning('Không tìm thấy thông tin đơn hàng.')
        return
    }

    // Set order ID cho modal chi tiết
    selectedOrderId.value = orderId
    
    // Đóng modal thành công
    isSuccessModalVisible.value = false
    
    // Đợi modal thành công đóng hoàn toàn
    await new Promise(resolve => setTimeout(resolve, 350))
    
    // Mở modal chi tiết đơn hàng
    if (orderDetailModalRef.value) {
        orderDetailModalRef.value.show()
    }
}

const requestTableSelection = () => {
    emit('request-table-selection')
}

const showPaymentModal = async (order) => {
    if (order) {
        updateLocalOrderFromServer(order, { syncBaseline: true })
    }
    isCreatingNew.value = false

    // Đóng tất cả modal khác trước khi mở payment modal
    await closeAllModals()

    await nextTick()
    paymentModalRef.value?.show()
}

const cancelOrder = () => {
    showCancelConfirm.value = true
}

const confirmCancelOrder = async () => {
    if (!localOrder.value.id) {
        isCreatingNew.value = false
        localOrder.value = { items: [] }
        showCancelConfirm.value = false
        return
    }
    try {
        loadingAction.value = 'cancel'
        const updatedOrder = await orderService.cancelOrder(localOrder.value.id)
        updateLocalOrderFromServer(updatedOrder, { syncBaseline: true })
        toast.success('Đã hủy đơn hàng.')
        emitOrderUpdated('cancelled', updatedOrder)
        showCancelConfirm.value = false
    } catch (error) {
        const message = error?.response?.data?.message || 'Hủy đơn hàng thất bại.'
        toast.error(message)
    } finally {
        loadingAction.value = null
    }
}

const isProcessing = (action) => loadingAction.value === action

const startDraft = () => {
    isCreatingNew.value = true
    if (!localOrder.value || !Array.isArray(localOrder.value.items)) {
        localOrder.value = {
            items: [],
            customerId: null,
            customerName: null,
            customerPhone: null,
            customerEmail: null
        }
    }
}

const attachToTable = (table) => {
    if (!table) return
    if (!localOrder.value || !Array.isArray(localOrder.value.items)) {
        localOrder.value = {
            items: [],
            customerId: null,
            customerName: null,
            customerPhone: null,
            customerEmail: null
        }
    }
    if (!localOrder.value.items.length) {
        isCreatingNew.value = false
    }
}

const detachFromTable = () => {
    // Keep existing draft items but mark as creating new until table is selected again
    if (!localOrder.value || !Array.isArray(localOrder.value.items)) {
        localOrder.value = {
            items: [],
            customerId: null,
            customerName: null,
            customerPhone: null,
            customerEmail: null
        }
    }
    isCreatingNew.value = true
}

const handleCustomerSearchInput = () => {
    // Tự động search khi gõ (auto-suggest)
    const keyword = customerSearchTerm.value.trim()
    if (!keyword) {
        customerSearchResults.value = []
        return
    }
    fetchCustomerSuggestions(keyword)
}

const triggerCustomerSearch = () => {
    const keyword = customerSearchTerm.value.trim()
    if (!keyword) {
        customerSearchResults.value = []
        return
    }
    fetchCustomerSuggestions(keyword)
}

const fetchCustomerSuggestions = async (keyword) => {
    if (!keyword) return
    if (customerSearchTimeout) {
        clearTimeout(customerSearchTimeout)
    }
    customerSearchTimeout = setTimeout(async () => {
        customerSearchLoading.value = true
        try {
            const response = await searchCustomers({ keyword, page: 0, size: 5 })
            const content = Array.isArray(response?.content)
                ? response.content
                : Array.isArray(response)
                    ? response
                    : []
            customerSearchResults.value = content
        } catch {
            toast.error('Không thể tìm khách hàng. Vui lòng thử lại.')
        } finally {
            customerSearchLoading.value = false
        }
    }, 200)
}

const selectCustomer = (customer) => {
    if (!customer) return
    if (!localOrder.value) {
        localOrder.value = { items: [] }
    }
    localOrder.value.customerId = customer.id ?? customer.customerId ?? null
    localOrder.value.customerName = customer.fullName ?? customer.customerName ?? customer.name ?? 'Khách lẻ'
    localOrder.value.customerPhone = customer.phone ?? customer.customerPhone ?? null
    localOrder.value.customerEmail = customer.email ?? customer.customerEmail ?? null
    customerSearchTerm.value = ''
    customerSearchResults.value = []
}

const clearSelectedCustomer = () => {
    if (!localOrder.value) return
    localOrder.value.customerId = null
    localOrder.value.customerName = null
    localOrder.value.customerPhone = null
    localOrder.value.customerEmail = null
    customerSearchTerm.value = ''
    customerSearchResults.value = []
}

watch(() => localOrder.value.customerId, () => {
    if (localOrder.value.customerId) {
        customerSearchTerm.value = ''
        customerSearchResults.value = []
    }
})

onBeforeUnmount(() => {
    if (customerSearchTimeout) {
        clearTimeout(customerSearchTimeout)
    }
})

defineExpose({ addProduct, startDraft, attachToTable, detachFromTable, showPaymentModal })
</script>

<style scoped>
/* Cart - Chuẩn hóa theo base.css */
.pos-cart {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-4);
	border-radius: var(--radius-sm);
	background: var(--color-card);
	border: 1px solid var(--color-border);
	padding: var(--spacing-4);
	position: relative;
	/* Fix để không di chuyển được */
	user-select: none;
	-webkit-user-drag: none;
	touch-action: none;
}

.pos-cart__header {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-2);
	padding-bottom: var(--spacing-4);
	border-bottom: 1px solid var(--color-border);
}

.pos-cart__header-top {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: var(--spacing-4);
	flex-wrap: wrap;
}

.pos-cart__header-left {
	display: flex;
	align-items: center;
	gap: var(--spacing-2);
}

.pos-cart__title {
	font-size: var(--font-size-lg);
	font-weight: var(--font-weight-semibold);
	color: var(--color-heading);
	margin: 0;
	font-family: var(--font-family-sans);
}

.pos-cart__order-code {
	font-size: var(--font-size-base);
	color: var(--color-text-muted);
	margin: 0;
}


.pos-cart__items {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-4);
}

/* Cart Item - Chuẩn hóa */
.pos-cart__item {
	display: grid;
	grid-template-columns: minmax(0, 1fr) auto auto;
	gap: var(--spacing-3);
	align-items: center;
	padding: var(--spacing-3) var(--spacing-4);
	border: 1px solid var(--color-border);
	border-radius: var(--radius-sm);
	background: var(--color-card);
	transition: all var(--transition-base);
}

.pos-cart__item:hover {
	background: var(--color-card-muted);
}

.pos-cart__item-info h6 {
	font-weight: var(--font-weight-semibold);
	font-size: var(--font-size-base);
	color: var(--color-heading);
	margin-bottom: var(--spacing-1);
	font-family: var(--font-family-sans);
}

.pos-cart__item-actions {
	display: inline-flex;
	align-items: center;
	gap: var(--spacing-2);
}

/* Quantity Controls - Chuẩn hóa */
.quantity-controls {
	display: flex;
	align-items: center;
	gap: 0;
	border: 1px solid var(--color-border);
	border-radius: var(--radius-sm);
	padding: 0;
	background: var(--color-card);
	overflow: hidden;
}

.quantity-btn {
	min-width: 32px;
	height: 32px;
	padding: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	border: none;
	background: transparent;
	color: var(--color-text-muted);
	transition: all var(--transition-base);
	cursor: pointer;
}

/* Tăng kích thước nút cho màn hình cảm ứng */
.quantity-btn--large {
	min-width: 44px;
	height: 44px;
}

.quantity-btn--large i {
	font-size: 20px;
}

.quantity-btn:hover:not(:disabled) {
	background: var(--color-card-muted);
	color: var(--color-primary);
}

.quantity-btn:active:not(:disabled) {
	background: var(--color-primary);
	color: var(--color-text-inverse);
}

.quantity-btn:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}

.quantity-btn i {
	font-size: 16px;
	line-height: 1;
}

.quantity-input {
	width: 60px;
	text-align: center;
	border: none;
	border-left: 1px solid var(--color-border);
	border-right: 1px solid var(--color-border);
	background: transparent;
	font-weight: var(--font-weight-semibold);
	font-size: var(--font-size-base);
	padding: var(--spacing-2);
	color: var(--color-text);
	min-height: 44px; /* Đồng bộ với nút lớn */
}

.quantity-input:focus {
	outline: 2px solid var(--color-primary);
	outline-offset: -2px;
	border-radius: 0;
	box-shadow: none;
}

.pos-cart__item-total {
	font-weight: var(--font-weight-semibold);
	color: var(--color-heading);
	font-size: var(--font-size-base);
	font-family: var(--font-family-sans);
}

/* Item Header - Tên món và nút xóa */
.pos-cart__item-header {
	display: flex;
	align-items: flex-start;
	gap: var(--spacing-2);
	margin-bottom: var(--spacing-1);
}

.pos-cart__item-name-wrapper {
	flex: 1;
	min-width: 0;
}

.pos-cart__item-customization {
	display: flex;
	flex-wrap: wrap;
	gap: var(--spacing-1);
	margin-top: var(--spacing-1);
	margin-bottom: var(--spacing-1);
}

.customization-badge {
	display: inline-block;
	padding: 2px var(--spacing-2);
	border-radius: var(--radius-sm);
	background: var(--color-soft-primary);
	color: var(--color-primary);
	font-size: var(--font-size-xs);
	font-weight: var(--font-weight-medium);
	border: 1px solid var(--color-primary);
}

.pos-cart__delete-btn--inline {
	min-width: 32px;
	height: 32px;
	padding: 0;
	flex-shrink: 0;
	margin-top: 2px; /* Căn chỉnh với tên món */
}

/* Item Notes - Ghi chú cho từng món */
.pos-cart__item-notes {
	margin-top: var(--spacing-3);
	padding-top: var(--spacing-3);
	padding-bottom: var(--spacing-2);
	border-top: 1px solid var(--color-border);
}

.pos-cart__item-notes-display {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: var(--spacing-2);
}

.pos-cart__item-notes-text {
	font-size: var(--font-size-sm);
	color: var(--color-text-muted);
	font-style: italic;
	display: flex;
	align-items: center;
	flex: 1;
	min-width: 0;
}

.pos-cart__item-notes-text i {
	font-size: 12px;
	margin-right: var(--spacing-1);
}

.pos-cart__item-notes-edit-btn {
	font-size: var(--font-size-sm);
	padding: var(--spacing-1) var(--spacing-3);
	white-space: nowrap;
	flex-shrink: 0;
	min-height: 32px;
}

.pos-cart__item-notes-edit {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-2);
}

.pos-cart__item-notes-edit .form-control {
	font-size: var(--font-size-sm);
	padding: var(--spacing-1) var(--spacing-2);
	border-radius: var(--radius-sm);
	border: 1px solid var(--color-border);
	background: var(--color-card);
	color: var(--color-text);
}

.pos-cart__item-notes-edit .form-control:focus {
	outline: 2px solid var(--color-primary);
	outline-offset: 0;
	border-color: var(--color-primary);
	box-shadow: none;
}

.pos-cart__item-notes-edit-actions {
	display: flex;
	gap: var(--spacing-1);
	justify-content: flex-end;
}

.pos-cart__item-notes-edit-actions .btn {
	padding: 2px 8px;
	font-size: var(--font-size-xs);
	min-width: 28px;
	height: 24px;
	display: flex;
	align-items: center;
	justify-content: center;
}

/* Summary - Chuẩn hóa */
.pos-cart__summary {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-4); /* Tăng từ spacing-3 lên spacing-4 để tránh bấm nhầm */
	padding: var(--spacing-5); /* Tăng padding */
	border-radius: var(--radius-sm);
	background: var(--color-card-muted);
	border: 1px solid var(--color-border);
}

.pos-cart__summary-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	font-size: var(--font-size-base);
	color: var(--color-text);
}

.pos-cart__summary-row--total {
	font-size: calc(var(--font-size-lg) * 1.3); /* Tăng từ lg lên ~xl */
	font-weight: var(--font-weight-bold); /* Đổi từ semibold sang bold */
	color: var(--color-heading);
	margin-top: var(--spacing-2); /* Tăng margin */
	padding-top: var(--spacing-2); /* Thêm padding */
	padding-bottom: var(--spacing-2);
	font-family: var(--font-family-sans);
}

.pos-cart__summary-row--total span:last-child {
	font-size: calc(var(--font-size-lg) * 1.4); /* Số tiền to hơn nữa */
	color: var(--color-primary); /* Màu xanh để nổi bật */
}

.pos-cart__summary-divider {
	height: 1px;
	background: var(--color-border);
	margin: var(--spacing-2) 0;
}

/* Customer Section - Chuẩn hóa */
.pos-cart__customer {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-3);
}

.pos-cart__customer-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: var(--spacing-2);
}

.pos-cart__customer-title {
	font-size: var(--font-size-base);
	font-weight: var(--font-weight-semibold);
	color: var(--color-heading);
	margin: 0;
	font-family: var(--font-family-sans);
}

.pos-cart__customer-clear {
	padding: var(--spacing-1) var(--spacing-2);
	border: none;
	background: transparent;
	color: var(--color-danger);
	font-size: var(--font-size-base);
	cursor: pointer;
	transition: all var(--transition-base);
	border-radius: var(--radius-sm);
	font-family: var(--font-family-sans);
}

.pos-cart__customer-clear:hover {
	background: var(--color-card-muted);
	color: var(--color-danger);
}

.pos-cart__customer-results {
	max-height: 220px;
	overflow-y: auto;
	border-radius: var(--radius-sm);
	border: 1px solid var(--color-border);
	background: var(--color-card);
	list-style: none;
	padding: 0;
	margin: var(--spacing-2) 0 0 0;
}

.pos-cart__customer-item {
	padding: var(--spacing-3) var(--spacing-4);
	cursor: pointer;
	border-bottom: 1px solid var(--color-border);
	transition: background-color var(--transition-base);
}

.pos-cart__customer-item:last-child {
	border-bottom: none;
}

.pos-cart__customer-item:hover {
	background: var(--color-card-muted);
}

.pos-cart__customer-item--empty {
	text-align: center;
	color: var(--color-text-muted);
	font-size: var(--font-size-base);
	cursor: default;
}

.pos-cart__customer-item--empty:hover {
	background: transparent;
}

.pos-cart__customer-item-name {
	font-weight: var(--font-weight-semibold);
	color: var(--color-heading);
	margin-bottom: var(--spacing-1);
	font-size: var(--font-size-base);
	font-family: var(--font-family-sans);
}

.pos-cart__customer-item-phone {
	color: var(--color-text-muted);
	font-size: var(--font-size-base);
}

.pos-cart__customer-hint {
	color: var(--color-text-muted);
	font-size: var(--font-size-base);
	display: block;
	margin-top: var(--spacing-2);
}

/* Customer Chip - Chuẩn hóa theo badge/pill */
.pos-cart__customer-chip {
	display: flex;
	align-items: center;
	gap: var(--spacing-3);
	padding: var(--spacing-3) var(--spacing-4);
	border-radius: var(--radius-sm);
	background: var(--color-soft-primary);
	border: 1px solid var(--color-primary);
	color: var(--color-primary);
}

/* Voucher Section - Chuẩn hóa */
.pos-cart__voucher {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-3);
}

.pos-cart__voucher-applied {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: var(--spacing-3) var(--spacing-4);
	border-radius: var(--radius-sm);
	background: var(--color-soft-emerald);
	border: 1px solid var(--color-success);
	color: var(--color-success);
	margin-bottom: var(--spacing-2);
}

.pos-cart__voucher-applied-content {
	flex: 1;
	font-size: var(--font-size-base);
	font-weight: var(--font-weight-medium);
}

.pos-cart__voucher-error {
	padding: var(--spacing-2) var(--spacing-3);
	border-radius: var(--radius-sm);
	background: var(--color-soft-rose);
	border: 1px solid var(--color-danger);
	color: var(--color-danger);
	font-size: var(--font-size-sm);
	display: flex;
	align-items: center;
	font-family: var(--font-family-sans);
}

.pos-cart__voucher-hint {
	color: var(--color-text-muted);
	font-size: var(--font-size-xs);
	display: block;
	margin-top: var(--spacing-1);
}

.voucher-input-icon {
	background: var(--color-card-muted);
	border-color: var(--color-border);
	color: var(--color-text-muted);
	transition: all var(--transition-base);
}


.pos-cart__actions {
	display: grid;
	gap: var(--spacing-4); /* Tăng từ spacing-3 lên spacing-4 */
}

/* Nút Thanh toán nổi bật */
.pos-cart__payment-btn {
	font-size: var(--font-size-lg);
	font-weight: var(--font-weight-bold);
	padding: var(--spacing-4) var(--spacing-6);
	box-shadow: 0 4px 12px rgba(25, 135, 84, 0.3);
	transition: all var(--transition-base);
	border: 2px solid var(--color-success);
}

.pos-cart__payment-btn:hover:not(:disabled) {
	transform: translateY(-2px);
	box-shadow: 0 6px 20px rgba(25, 135, 84, 0.4);
	background-color: var(--color-success-hover);
	border-color: var(--color-success-hover);
}

.pos-cart__payment-btn:active:not(:disabled) {
	transform: translateY(0);
	box-shadow: 0 2px 8px rgba(25, 135, 84, 0.3);
}

/* Cải thiện nút xóa - tách xa nút + để tránh bấm nhầm */
.pos-cart__delete-btn {
	margin-left: var(--spacing-2);
	min-width: 44px; /* Tăng kích thước cho dễ bấm */
	height: 44px;
	padding: 0 var(--spacing-3);
}

/* Cải thiện nút lưu đơn - làm rõ hơn nhưng không lấn át nút thanh toán */
.pos-cart__save-btn {
	font-weight: var(--font-weight-semibold);
	min-height: 44px;
}

/* Status Pill - Chuẩn hóa theo badge/pill hệ thống */
.status-pill {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: var(--spacing-1) var(--spacing-2);
	border-radius: var(--radius-sm);
	font-size: var(--font-size-sm);
	font-weight: var(--font-weight-medium);
	font-family: var(--font-family-sans);
}

.status-pill i {
	font-size: 16px;
	line-height: 1;
}

.status-pill--pending {
	background: var(--color-soft-amber);
	border: 1px solid var(--color-warning);
	color: var(--color-warning);
}

.status-pill--paid {
	background: var(--color-soft-emerald);
	border: 1px solid var(--color-success);
	color: var(--color-success);
}

.status-pill--cancelled {
	background: var(--color-soft-rose);
	border: 1px solid var(--color-danger);
	color: var(--color-danger);
}

.status-pill--transferred {
	background: var(--color-soft-sky);
	border: 1px solid var(--color-info);
	color: var(--color-info);
}

.status-pill--takeaway {
	background: var(--color-soft-primary);
	border: 1px solid var(--color-primary);
	color: var(--color-primary);
}

.status-pill--draft,
.status-pill--default {
	background: var(--color-card-muted);
	border: 1px solid var(--color-border);
	color: var(--color-text-muted);
}

@media (max-width: 768px) {
	.pos-cart__item {
		grid-template-columns: minmax(0, 1fr);
	}

	.pos-cart__item-total {
		justify-self: flex-end;
	}

	.pos-cart__actions {
		grid-template-columns: minmax(0, 1fr);
	}
}

/* Drawer Styles */
.order-cart-drawer-backdrop {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	z-index: 1050;
	display: flex;
	align-items: center;
	justify-content: flex-end;
	animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
	from {
		opacity: 0;
	}

	to {
		opacity: 1;
	}
}

.order-cart-drawer {
	width: 50%;
	max-width: 600px;
	height: 100vh;
	background: var(--color-card);
	box-shadow: var(--shadow-modal);
	display: flex;
	flex-direction: column;
	transform: translateX(100%);
	transition: transform 0.3s ease-out;
	position: relative;
	z-index: 1051;
}

.order-cart-drawer--open {
	transform: translateX(0);
}

.order-cart-drawer__header {
	padding: var(--spacing-4);
	border-bottom: 1px solid var(--color-border);
	background: var(--color-card);
	display: flex;
	justify-content: space-between;
	align-items: center;
	flex-shrink: 0;
}

.order-cart-drawer__header-left {
	flex: 1;
}

.order-cart-drawer__title {
	margin: 0;
	font-size: var(--font-size-lg);
	font-weight: var(--font-weight-semibold);
	color: var(--color-heading);
	display: flex;
	align-items: center;
	font-family: var(--font-family-sans);
}

.order-cart-drawer__total-badge {
	margin-top: var(--spacing-2);
	font-size: var(--font-size-xl);
	font-weight: var(--font-weight-bold);
	color: var(--color-primary);
}

.order-cart-drawer__voucher-progress {
	margin-top: var(--spacing-3);
	padding-top: var(--spacing-3);
	border-top: 1px solid var(--color-border);
}

.order-cart-drawer__voucher-progress-label {
	font-size: var(--font-size-sm);
	font-weight: var(--font-weight-semibold);
	color: var(--color-text);
	margin-bottom: var(--spacing-2);
	display: flex;
	align-items: center;
}

.order-cart-drawer__voucher-progress-bar {
	width: 100%;
	height: 8px;
	background: var(--color-card-muted);
	border-radius: var(--radius-sm);
	overflow: hidden;
	margin-bottom: var(--spacing-1);
}

.order-cart-drawer__voucher-progress-fill {
	height: 100%;
	background: var(--color-primary);
	border-radius: var(--radius-sm);
	transition: width 0.3s ease;
}

.order-cart-drawer__voucher-progress-text {
	font-size: var(--font-size-xs);
	display: block;
}

.order-cart-drawer__close-btn {
	border-radius: var(--radius-sm);
	padding: var(--spacing-2);
	width: 36px;
	height: 36px;
	display: flex;
	align-items: center;
	justify-content: center;
}

.order-cart-drawer__body {
	flex: 1;
	overflow-y: auto;
	padding: var(--spacing-4);
	display: flex;
	flex-direction: column;
	gap: var(--spacing-3);
}

.order-cart-drawer__toolbar {
	flex-shrink: 0;
}

.order-cart-drawer__loading {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: var(--spacing-8);
	color: var(--color-text-muted);
}

.order-cart-drawer__items {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-3);
}

.order-cart-drawer__item {
	display: grid;
	grid-template-columns: 60px 1fr auto auto;
	gap: var(--spacing-3);
	padding: var(--spacing-3);
	background: var(--color-card);
	border: 1px solid var(--color-border);
	border-radius: var(--radius-sm);
	align-items: center;
	transition: all var(--transition-base);
}

.order-cart-drawer__item:hover {
	border-color: var(--color-primary);
	background: var(--color-card-muted);
}

.order-cart-drawer__item-image {
	width: 60px;
	height: 60px;
	border-radius: var(--radius-sm);
	overflow: hidden;
	background: var(--color-card-muted);
	display: flex;
	align-items: center;
	justify-content: center;
}

.order-cart-drawer__item-image img {
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.order-cart-drawer__item-placeholder {
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	color: var(--color-text-muted);
	font-size: 24px;
}

.order-cart-drawer__item-info {
	flex: 1;
	min-width: 0;
}

.order-cart-drawer__item-name {
	margin: 0 0 var(--spacing-1) 0;
	font-size: var(--font-size-base);
	font-weight: var(--font-weight-semibold);
	color: var(--color-heading);
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	font-family: var(--font-family-sans);
}

.order-cart-drawer__item-price {
	margin: 0;
	font-size: var(--font-size-sm);
	color: var(--color-text-muted);
}

.order-cart-drawer__item-notes-section {
	margin-top: var(--spacing-2);
	padding-top: var(--spacing-2);
	border-top: 1px solid var(--color-border);
}

.order-cart-drawer__item-notes-display {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: var(--spacing-2);
	flex-wrap: wrap;
}

.order-cart-drawer__item-notes {
	font-size: var(--font-size-xs);
	color: var(--color-text-muted);
	font-style: italic;
	display: flex;
	align-items: center;
	flex: 1;
	min-width: 0;
}

.order-cart-drawer__item-notes-edit-btn {
	font-size: var(--font-size-xs);
	padding: 2px 6px;
	text-decoration: none;
	white-space: nowrap;
	flex-shrink: 0;
}

.order-cart-drawer__item-notes-edit-btn:hover {
	text-decoration: underline;
}

.order-cart-drawer__item-notes-edit {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-2);
}

.order-cart-drawer__item-notes-edit .form-control {
	font-size: var(--font-size-sm);
	padding: var(--spacing-1) var(--spacing-2);
	border-radius: var(--radius-sm);
	border: 1px solid var(--color-border);
	background: var(--color-card);
	color: var(--color-text);
}

.order-cart-drawer__item-notes-edit .form-control:focus {
	outline: 2px solid var(--color-primary);
	outline-offset: 0;
	border-color: var(--color-primary);
	box-shadow: none;
}

.order-cart-drawer__item-notes-edit-actions {
	display: flex;
	gap: var(--spacing-1);
	justify-content: flex-end;
}

.order-cart-drawer__item-notes-edit-actions .btn {
	padding: 2px 8px;
	font-size: var(--font-size-xs);
	min-width: 28px;
	height: 24px;
	display: flex;
	align-items: center;
	justify-content: center;
}

.order-cart-drawer__item-actions {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-2);
	align-items: center;
}

.order-cart-drawer__item-total {
	font-size: var(--font-size-lg);
	font-weight: var(--font-weight-semibold);
	color: var(--color-heading);
	text-align: right;
	min-width: 100px;
	font-family: var(--font-family-sans);
}

.order-cart-drawer__footer {
	padding: var(--spacing-4);
	border-top: 1px solid var(--color-border);
	background: var(--color-card);
	flex-shrink: 0;
	display: flex;
	flex-direction: column;
	gap: var(--spacing-3);
}

.order-cart-drawer__summary {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-2);
}

.order-cart-drawer__summary-row {
	display: flex;
	justify-content: space-between;
	font-size: var(--font-size-base);
	color: var(--color-text);
}

.order-cart-drawer__summary-row--total {
	font-size: var(--font-size-lg);
	font-weight: var(--font-weight-semibold);
	padding-top: var(--spacing-2);
	border-top: 1px solid var(--color-border);
	color: var(--color-heading);
	font-family: var(--font-family-sans);
}

.order-cart-drawer__summary-divider {
	height: 1px;
	background: var(--color-border);
	margin: var(--spacing-2) 0;
}

.order-cart-drawer__actions {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-2);
}

.pos-cart__header-right {
	display: flex;
	align-items: center;
	gap: var(--spacing-2);
}

.pos-cart__expand-btn {
	display: flex;
	align-items: center;
	gap: var(--spacing-1);
}

/* Responsive Drawer */
@media (max-width: 992px) {
	.order-cart-drawer {
		width: 60%;
	}
}

@media (max-width: 768px) {
	.order-cart-drawer {
		width: 90%;
		max-width: none;
	}

	.order-cart-drawer__item {
		grid-template-columns: 50px 1fr;
		gap: var(--spacing-2);
	}

	.order-cart-drawer__item-actions {
		grid-column: 1 / -1;
		flex-direction: row;
		justify-content: space-between;
		width: 100%;
	}

	.order-cart-drawer__item-total {
		grid-column: 1 / -1;
		text-align: left;
		margin-top: var(--spacing-2);
	}
}
</style>
