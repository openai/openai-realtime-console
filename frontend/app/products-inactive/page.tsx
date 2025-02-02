import ProductsAndSub from "../components/ProductsAndSub";

export default function Component() {
    return (
        <div className="container px-0 mx-auto">
            {/* Hero Section */}
            <p className="text-center text-muted-foreground mb-4">
                These products are currently inactive. Check out our active
                product{" "}
                <a href="/products" className="text-primary underline">
                    here
                </a>
                .
            </p>
            <ProductsAndSub />
        </div>
    );
}
