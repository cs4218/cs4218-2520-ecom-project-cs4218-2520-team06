const productModel = jest.fn(function(doc = {}) {
    Object.assign(this, doc);
    this.photo = this.photo ?? {}
});

productModel.findByIdAndUpdate = jest.fn();
productModel.findByIdAndDelete = jest.fn();
productModel.prototype.save = jest.fn(function() {
    return Promise.resolve(this);
});

export default productModel;
