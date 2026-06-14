package models

type ProductBranch struct {
	ID         uint `gorm:"primaryKey;autoIncrement" json:"id"`
	MerchantID *uint `gorm:"index" json:"merchant_id,omitempty"`
	BranchID   uint `gorm:"uniqueIndex:idx_product_branch;not null" json:"branch_id"`
	ProductID  uint `gorm:"uniqueIndex:idx_product_branch;not null" json:"product_id"`
	Price      int  `gorm:"type:integer;not null" json:"price"`
	CostPrice  int  `gorm:"type:integer;default:0" json:"cost_price"`
	Stock      int  `gorm:"type:integer;default:0" json:"stock"`
	TrackStock bool `gorm:"default:true" json:"track_stock"`
	Branch     Branch  `gorm:"foreignKey:BranchID" json:"-"`
	Product    Product `gorm:"foreignKey:ProductID" json:"-"`
}

type SetProductBranchRequest struct {
	Price      int  `json:"price"`
	CostPrice  int  `json:"cost_price"`
	Stock      int  `json:"stock"`
	TrackStock bool `json:"track_stock"`
}
