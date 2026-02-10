package com.ecommerce.likefood.common.specification;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;


@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
public @interface FilterField {
    String column() default "";
    FilterOperator operator() default FilterOperator.EQUAL;
}
