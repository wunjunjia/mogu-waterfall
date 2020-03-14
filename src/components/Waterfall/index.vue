<template>
  <div class="waterfall-container">
    <div
      v-if="merge"
      class="merge-container"
      :style="{
        height: mergeContainerHeight,
        width: mergeContainerWidth,
        left: mergeContainerLeft,
      }">
      <slot name="merge" />
    </div>
    <div
      class="col"
      v-for="(item, index) in columns"
      ref="col"
      :key="item.name"
      :style="{ paddingTop: mergeColumns.includes(index) ? paddingTop : 0 }">
      <slot :name="item.name" />
      <div
        class="item"
        v-for="(item, index) in item.list"
        :key="item"
        :class="index % 2 === 0 ? 'even' : 'odd'">
        <img class="image" :src="item" alt="image">
      </div>
    </div>
  </div>
</template>

<script>
import { data } from '@/mock';
const WATERFALL_COL_WIDTH = 220;
const WATERFALL_COL_GAP = 25;
export default {
  name: 'Waterfall',
  props: {
    merge: {
      type: Boolean,
      default: false,
    },
    mergeColumns: {
      type: Array,
      default: () => ([]),
    },
    mergeHeight: {
      type: Number,
      default: 0,
    },
  },
  data() {
    return {
      columns: [
        { name: 'first-col', list: [] },
        { name: 'second-col', list: [] },
        { name: 'third-col', list: [] },
        { name: 'fourth-col', list: [] },
        { name: 'fifth-col', list: [] },
      ],
      list: [], // 存放请求的数据
      pageSize: 21,  // 每次请求的数据个数
      currentPage: 1,
      request: false, // 是否正在请求
      finished: false,  // 是否已经请求所有数据
      isRender: false,  // 是否正在渲染
      renderIndex: 0, // 当前渲染的item下标
      lastScrollTop: -1, // 上级滚动的距离
    };
  },
  computed: {
    mergeContainerLeft() {
      return `${this.mergeColumns[0] * (WATERFALL_COL_WIDTH + WATERFALL_COL_GAP)}px`;
    },
    mergeContainerWidth() {
      return `${this.mergeColumns.length * WATERFALL_COL_WIDTH + (this.mergeColumns.length - 1) * WATERFALL_COL_GAP}px`;
    },
    mergeContainerHeight() {
      return `${this.mergeHeight}px`;
    },
    paddingTop() {
      return `${this.mergeHeight + WATERFALL_COL_GAP}px`;
    },
  },
  watch: {
    renderIndex() {
      this.renderWaterfall();
    },
  },
  methods: {
    miniHeight() {
      return Math.min.apply(null, this.$refs.col.map(item => item.offsetHeight));
    },
    miniIndex() {
      const miniHeight = this.miniHeight();
      return this.$refs.col.map(item => item.offsetHeight).findIndex(item => item === miniHeight);
    },
    scroll() {
      const { scrollTop } = document.documentElement;
      if (this.lastScrollTop > scrollTop) return;
      this.lastScrollTop = scrollTop;
      this.renderWaterfall();
    },
    loadData() {
      this.request = true;
      return Promise.resolve().then(() => {
        for (let i = (this.currentPage - 1) * this.pageSize; i < this.currentPage * this.pageSize; i += 1) this.list.push(data[i]);
        this.request = false;
        this.currentPage += 1;
        if (this.currentPage === 4) this.finished = true;
     });
    },
    renderWaterfall() {
      // 正在渲染的话返回
      if (this.isRender) return;
      // 如果已经请求所有数据且渲染的item是list数组中最后一个时返回
      if (this.finished && this.renderIndex === this.list.length - 1) return;
      const { scrollTop, clientHeight } = document.documentElement;
      // 如果高度最小的列减去滚动的高度大于可视区的1.5倍返回
      if (this.miniHeight() - scrollTop > clientHeight * 1.5) return;
      // 如果当前已经渲染的个数加上一页的请求数量大于当前数组个数就发起请求。
      if (!this.finished && !this.request && this.renderIndex + this.pageSize >= this.list.length) this.loadData();
      this.isRender = true;
      this.columns[this.miniIndex()].list.push(this.list[this.renderIndex]);
      this.$nextTick(() => {
        this.renderIndex += 1;
        this.isRender = false;
      });
    },
  },
  mounted() {
    this.loadData().then(() => {
      // if (this.list.length === 0) return;
      this.renderWaterfall();
      window.addEventListener('scroll', this.scroll, false);
    });
  },
};
</script>

<style>
.waterfall-container {
  position: relative;
  width: 100%;
  overflow: hidden;
}
.col {
  float: left;
  width: 220px;
  margin-right: 25px;
}
.col:last-child {
  margin-right: 0;
}
/* .col:nth-of-type(5) {
  margin-right: 0;
} */
.item {
  width: 100%;
  margin-bottom: 20px;
}
.item:last-child {
  margin-bottom: 0;
}
.item.even {
  height: 320px;
}
.item.odd {
  height: 230px;
}
.image {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 10px;
  object-fit: cover;
}
.merge-container {
  position: absolute;
  top: 0;
}
</style>