const DepenseCategory = require('../models/appmodel/Depense');

// Create a new depense category
exports.createDepenseCategory = async (req, res) => {
  const { name, description, color, createdBy } = req.body;

  try {
    const newCategory = new DepenseCategory({
      name,
      description,
      color,
      createdBy,
    });

    const savedCategory = await newCategory.save();
    res.status(201).json(savedCategory);
  } catch (error) {
    res.status(500).json({ message: 'Error creating depense category', error });
  }
};

// Get all depense categories
exports.getDepenseCategories = async (req, res) => {
    const { createdBy } = req.query;
  try {
   
    const filter = createdBy ? { createdBy } : {};
    const categories = await DepenseCategory.find( filter);
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching depense categories', error });
  }
};

// Get a single depense category by ID
exports.getDepenseCategoryById = async (req, res) => {
  const { id } = req.params;

  try {
    const category = await DepenseCategory.findById(id);
    if (!category) return res.status(404).json({ message: 'Depense category not found' });

    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching depense category', error });
  }
};

// Update a depense category by ID
exports.updateDepenseCategory = async (req, res) => {
  const { id } = req.params;
  const { name, description, color, enabled } = req.body;

  try {
    const updatedCategory = await DepenseCategory.findByIdAndUpdate(
      id,
      { name, description, color, enabled },
      { new: true }
    );

    if (!updatedCategory) return res.status(404).json({ message: 'Depense category not found' });

    res.status(200).json(updatedCategory);
  } catch (error) {
    res.status(500).json({ message: 'Error updating depense category', error });
  }
};

// Delete a depense category by ID
exports.deleteDepenseCategory = async (req, res) => {
  const { id } = req.params;

  try {
    const category = await DepenseCategory.findByIdAndUpdate(
      id,
      { removed: true },
      { new: true }
    );

    if (!category) return res.status(404).json({ message: 'Depense category not found' });

    res.status(200).json({ message: 'Depense category removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing depense category', error });
  }
};
