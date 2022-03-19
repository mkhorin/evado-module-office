## 5.3.0

* add dynamic navigation nodes
* controller/ModelController
    - separate transition action from save action
* escape text value
* fix tree list view
* refactor extended hint
* remove class name translation
* view/template/model/selectClass
    - add pagination to class list

## 5.2.0

* add classes view type
* add loading overlay
* controller/ModelController
    - protect a linked object from deletion
    - set default values when cloning an object
* escape labels by default
* fix custom group css
* view/template/_meta/attr/edit/boolean
    - move extended hint to boolean attribute wrapper
* view/template/_meta/attr/edit/text
    - auto adjust text field height

## 5.1.0

* update names of condition operators

## 5.0.0

* add HTML title to stack frames
* add custom commands to lists
* add view history of model changes as security action
* fix related object sorting

## 4.0.0

* add digital signature
* add S3 view
* controller/ServiceController
    - add pass-through search to navigation
* loadable groups and tabs

## 3.1.0

* controller/ModelController
    - add version resolving when creating a model
* view/template/_meta/attr/edit/boolean
    - fix checkbox label translation

## 3.0.0

* migration to Bootstrap 5
* option to hide empty attribute

## 2.2.0

* change adaptive CSS classes
* fix asset configuration
* fix sidebar menu

## 2.0.0

* add client attribute handlers from metadata
* migration to Bootstrap 4
* update type request getters
* use optional chaining

## 1.8.0

* component/base/BaseMetaController
    - fix query creation
* controller/ModelController
    - refactor transition solver
    - fix query creation
* view/template/_part/nav/sideMenu
    - fix path to template

## 1.7.1

* controller/ModelController
    - fix relation view to resolve access

## 1.7.0

* model/DataHistory
    - move class implementation to base application
* view/template/_meta/group/children
    - fix attribute with forbidden related object
* view/template/_meta/attr/noAccess
    - add optional hiding of forbidden attributes
    - fix forbidden hidden attribute