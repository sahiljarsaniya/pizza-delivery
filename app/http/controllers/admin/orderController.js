const Order = require('../../../models/order');

function orderController() {
  return {
    index(req, res) {
      Order.find({ status: { $ne: 'completed' } })
        .sort({ createdAt: -1 })
        .populate('customerId', '-password')
        .exec()
        .then((orders) => {
          if (req.xhr) {
            return res.json(orders);
          }
          return res.render('admin/orders');
        })
        .catch((error) => {
          // Handle the error
          console.error(error);
          return res.status(500).send('Internal Server Error');
        });
    }
  };
}

module.exports = orderController;
