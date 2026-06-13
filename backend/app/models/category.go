package models

type Category struct {
	ID       uint   `gorm:"primaryKey;autoIncrement" json:"id"`
	BranchID *uint  `gorm:"index" json:"branch_id,omitempty"`
	Name     string `gorm:"type:varchar(100);uniqueIndex;not null" json:"name"`
}
