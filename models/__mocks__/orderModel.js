const orderModel = jest.fn();

// Sample mock for find (needs chainable methods)
orderModel.find = jest.fn(() => ({
  populate: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  then: jest.fn((callback) => Promise.resolve(callback([]))),
}));

orderModel.findOne = jest.fn().mockResolvedValue(null);

orderModel.findByIdAndUpdate = jest.fn().mockResolvedValue(null);

export default orderModel;
