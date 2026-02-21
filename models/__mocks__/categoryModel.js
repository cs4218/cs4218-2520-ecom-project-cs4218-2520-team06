// Gallen Ong, A0252614L
const categoryModel = jest.fn(function (doc = {}) {
  Object.assign(this, doc);
});

categoryModel.find = jest.fn();
categoryModel.findOne = jest.fn();
categoryModel.findByIdAndUpdate = jest.fn();
categoryModel.findByIdAndDelete = jest.fn();
categoryModel.prototype.save = jest.fn(function () {
  return Promise.resolve(this);
});

export default categoryModel;
