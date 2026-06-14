package models

type Category struct {
	ID       uint   `gorm:"primaryKey;autoIncrement" json:"id"`
	MerchantID *uint  `gorm:"index" json:"merchant_id,omitempty"`
	BranchID *uint  `gorm:"uniqueIndex:idx_cat_name_branch" json:"branch_id,omitempty"`
	Name     string `gorm:"type:varchar(100);uniqueIndex:idx_cat_name_branch;not null" json:"name"`
}
